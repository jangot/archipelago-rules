import { MessageProviderName } from './message-provider.enum';

export interface MessagePayload {
  readonly type: MessageProviderName;
}

export interface MessagePayloadSqs extends MessagePayload {
  readonly type: 'sqs';
  queueUrl: string;
  message: Record<string, any>;
  delaySeconds?: number;
  messageAttributes?: Record<string, any>;
  messageSystemAttributes?: Record<string, any>;
  groupId?: string;
  deduplicationId?: string;
}

export interface MessagePayloadTest extends MessagePayload {
  readonly type: 'test';
  message: string;
}

export type MessagePayloads = MessagePayloadSqs | MessagePayloadTest;
