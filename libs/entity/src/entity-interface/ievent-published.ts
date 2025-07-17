import { EventPublishedStatus } from '../enum/event-published-status';

export interface IEventPublished {
  id: string;
  eventId: string;
  subscriberId: string;
  status: EventPublishedStatus;
  createdAt: Date;
  completedAt?: Date | null;
  retryCount: number;
  error?: string | null;
  failedAt?: Date | null;
  fatalFailureAt?: Date | null;
}
