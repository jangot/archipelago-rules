import { EventPublishedStatus } from '@library/entity/enum/event-published-status';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('event_published', { schema: 'notifications' })
export class EventPublished {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  eventId: string;

  @Column({ type: 'uuid' })
  subscriberId: string;

  @Column({ type: 'enum', enum: EventPublishedStatus })
  status: EventPublishedStatus;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'text', nullable: true })
  error?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt?: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  fatalFailureAt?: Date | null;
}
