export interface IEventStore {
  id: string;
  event_name: string;
  payload: any;
  metadata: any;
  occurred_at: Date;
  correlation_id?: string;
  causation_id?: string;
  deduplication_id: number;
}
