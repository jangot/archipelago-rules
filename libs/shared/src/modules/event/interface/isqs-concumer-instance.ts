import { Message } from '@aws-sdk/client-sqs';

export interface SqsInstance {
  start: (callback: (e: Message) => Promise<void>) => Promise<void>;
  finish: () => Promise<void>;
}
