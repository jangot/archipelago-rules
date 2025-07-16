import { IEventSubscriber } from '@library/entity/entity-interface/ievent-subscriber';
import { EventSubscriberServiceName } from '@library/entity/enum/event-subscriber-service-name';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('event_subscribers', { schema: 'notifications' })
@Index(['subscriber', 'name', 'destination'], { unique: true })
export class EventSubscriber implements IEventSubscriber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: false })
  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  subscriber: EventSubscriberServiceName;

  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * The destination of the event subscriber
   *
   * @description The destination of the event subscriber.
   * @type {string}
   * @memberof EventSubscriber
   * @example '/api/core/events/payment-failed', '/api/payment/events/loan-application-created', '/api/notification/events/notification'
   */
  @Column({ type: 'text' })
  destination: string;
}
