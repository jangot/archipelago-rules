import { IEventSubscriber } from '@library/entity/entity-interface/ievent-subscriber';
import { EventSubscriberServiceName } from '@library/entity/enum/event-subscriber-service-name';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('event_subscribers', { schema: 'notifications' })
@Index(['subscriberService', 'name', 'destination'], { unique: true })
export class EventSubscriber implements IEventSubscriber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  @Index({ unique: false })
  @Column({ type: 'text' })
  eventName: string;

  @Column({ type: 'text' })
  subscriberService: EventSubscriberServiceName;

  @Column({ type: 'text', nullable: true })
  description: string | null;

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

  @Column({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;
}
