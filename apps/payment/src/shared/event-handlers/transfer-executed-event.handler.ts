import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TransferExecutedEvent } from './events';

@Injectable()
@EventsHandler(TransferExecutedEvent)
export class TransferExecutedEventHandler implements IEventHandler<TransferExecutedEvent> {
  private readonly logger: Logger = new Logger(TransferExecutedEventHandler.name);

  handle(event: TransferExecutedEvent) {
    throw new Error('Method not implemented.');
  }
}
