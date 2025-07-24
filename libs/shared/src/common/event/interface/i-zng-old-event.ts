import { IEvent } from '@nestjs/cqrs';

export interface IZngOldEvent extends IEvent {
  name: string;
  isExternal: boolean;
}
