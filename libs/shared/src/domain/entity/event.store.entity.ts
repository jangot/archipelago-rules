import { IEventStore } from '@library/entity/entity-interface/ievent-store';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('event_store', { schema: 'notifications' })
export class EventStore implements IEventStore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: false })
  @Column({ type: 'text' })
  event_name: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ type: 'jsonb', default: {} })
  metadata: any;

  @Index({ unique: false })
  @Column({ type: 'timestamptz', default: () => 'now()' })
  occurred_at: Date;

  @Column({ type: 'uuid', nullable: true })
  correlation_id?: string;

  @Column({ type: 'uuid', nullable: true })
  causation_id?: string;

  // CRC32 of the event name + event payload + causation_id || '' + correlation_id || ''
  @Column({ type: 'int', nullable: false })
  deduplication_id: number;
}
