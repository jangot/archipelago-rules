import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

import { ZirtueDistributedEvent } from '@library/shared/modules/event';
import { IZirtueEvent } from '../interface';
import { EventSnsPublisherService } from './event-sns-publisher.service';

@Injectable()
export class EventPublisherService {
  logger = new Logger(EventSnsPublisherService.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly snsPublisher: EventSnsPublisherService,
  ) {}

  /**
   * Publishes an event to the local EventBus and, if necessary, to the external circuit via SNS.
   *
   * Publication logic:
   * 1. All events are always published to the local EventBus for internal application processing
   * 2. Events that extend ZirtueDistributedEvent are additionally sent to the external circuit via AWS SNS
   *
   * Event inheritance:
   * - Events extending ZirtueEvent: published locally only
   * - Events extending ZirtueDistributedEvent: published locally and to external circuit
   *
   * @param event - Event to publish. Must implement IZirtueEvent<T> interface
   * @returns Promise<boolean> - Always returns true (successful publication)
   *
   * @example
   * ```typescript
   * // Local event class (EventBus only)
   * class UserLoginEvent extends ZirtueEvent<{ userId: number; action: string }> {
   *   constructor(payload: { userId: number; action: string }) {
   *     super(payload);
   *   }
   * }
   * const localEvent = new UserLoginEvent({ userId: 123, action: 'login' });
   * await eventPublisher.publish(localEvent);
   *
   * // Distributed event class (EventBus + SNS)
   * class PaymentCompletedEvent extends ZirtueDistributedEvent<{
   *   userId: number;
   *   action: string
   * }> {
   *   constructor(payload: { userId: number; action: string }) {
   *     super(payload);
   *   }
   * }
   * const distributedEvent = new PaymentCompletedEvent({
   *   userId: 123,
   *   action: 'payment_completed'
   * });
   * await eventPublisher.publish(distributedEvent);
   * ```
   */
  public async publish<T extends IZirtueEvent<any>>(event: T): Promise<boolean> {
    await this.eventBus.publish(event);
    this.logger.debug({ event, info: 'event published locally.' });

    if (this.isCoreEvent(event) && event.type === ZirtueDistributedEvent.name) {
      this.logger.debug({ event, info: 'event published globally.' });
      await this.snsPublisher.publish(event);
    }

    return true;
  }

  private isCoreEvent(event: IZirtueEvent<any>): event is IZirtueEvent<any> {
    return 'type' in event && 'payload' in event;
  }
}
