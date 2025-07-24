import { IEvent } from '@nestjs/cqrs';

export interface IZngEvent extends IEvent {
  name: string;
  isExternal: boolean;
}
Ω
