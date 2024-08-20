import { TickerKind } from '@prisma/client';

export class ReserveStopDTO {
  spots: string[];
  ticketKind: TickerKind;
  email: string;
}
