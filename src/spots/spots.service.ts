import { Injectable } from '@nestjs/common';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SpotStatus } from '@prisma/client';

@Injectable()
export class SpotsService {
  constructor(private prismaService: PrismaService) {}

  create(eventId: string, createSpotDto: CreateSpotDto) {
    this.prismaService.event.findFirstOrThrow({
      where: { id: eventId },
    });

    return this.prismaService.spot.create({
      data: { ...createSpotDto, eventId, status: SpotStatus.available },
    });
  }

  findAll(eventId: string) {
    return this.prismaService.spot.findMany({ where: { eventId } });
  }

  findOne(eventId: string, spotId: string) {
    return this.prismaService.spot.findUnique({
      where: { id: spotId, eventId },
    });
  }

  update(eventId: string, spotId: string, updateSpotDto: UpdateSpotDto) {
    return this.prismaService.spot.update({
      where: { eventId, id: spotId },
      data: updateSpotDto,
    });
  }

  remove(spotId: string, eventId: string) {
    return this.prismaService.spot.delete({ where: { id: spotId, eventId } });
  }
}
