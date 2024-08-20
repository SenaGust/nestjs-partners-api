import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReserveStopDTO } from './dto/reserve-stop.dto';
import { Prisma, SpotStatus, TicketStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prismaService: PrismaService) {}

  create(createEventDto: CreateEventDto) {
    return this.prismaService.event.create({
      data: { ...createEventDto, date: new Date(createEventDto.date) },
    });
  }

  findAll() {
    return this.prismaService.event.findMany();
  }

  findOne(id: string) {
    return this.prismaService.event.findUnique({ where: { id } });
  }

  update(id: string, updateEventDto: UpdateEventDto) {
    return this.prismaService.event.update({
      data: { ...updateEventDto, date: new Date(updateEventDto.date) },
      where: { id },
    });
  }

  remove(id: string) {
    return this.prismaService.event.delete({ where: { id } });
  }

  async reserveSpot(dto: ReserveStopDTO, eventId: string) {
    const spots = await this.prismaService.spot.findMany({
      where: { name: { in: dto.spots }, eventId },
    });

    if (spots.length != dto.spots.length) {
      const spotNames = spots.map((spot) => spot.name);
      const notFoundSpotNames = dto.spots.filter(
        (name) => !spotNames.includes(name),
      );

      throw new HttpException(
        `Spots ${notFoundSpotNames.join(', ')} not found`,
        HttpStatus.NOT_FOUND,
      );
    }
    try {
      const tickets = await this.prismaService.$transaction(
        async (prisma) => {
          await prisma.reservationHistory.createMany({
            data: spots.map((spot) => ({
              spotId: spot.id,
              tickerKind: dto.ticketKind,
              email: dto.email,
              status: TicketStatus.reserved,
            })),
          });

          await prisma.spot.updateMany({
            where: { id: { in: spots.map(({ id }) => id) } },
            data: { status: SpotStatus.reserved },
          });

          return await Promise.all(
            spots.map((spot) =>
              prisma.ticket.create({
                data: {
                  spotId: spot.id,
                  tickerKind: dto.ticketKind,
                  email: dto.email,
                },
              }),
            ),
          );
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      );

      return tickets;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        switch (e.code) {
          case 'P2002': // unique contraint violation
            throw new HttpException(
              'Spot already reserved',
              HttpStatus.BAD_REQUEST,
            );

          case 'P2034': // transaction conflict
            throw new HttpException(
              'Some spots are already reserved',
              HttpStatus.BAD_REQUEST,
            );

          default:
            throw e;
        }
      }
    }
  }
}
