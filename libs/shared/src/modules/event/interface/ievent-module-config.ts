import { SNSClientConfig } from '@aws-sdk/client-sns';
import { SQSClientConfig } from '@aws-sdk/client-sqs';

export interface EventModuleSNSConfig {
  topics: string[],
  clientConfig: SNSClientConfig,
}

export interface EventModuleSQSQueueOptions {
  url: string;
  maxNumberOfMessages: number;
  waitTimeSeconds: number;
}

export interface EventModuleSQSConfig {
  queues: EventModuleSQSQueueOptions[];
  clientConfig: SQSClientConfig;
}

export interface IEventModuleConfig {
  serviceName: string;
  sns?: EventModuleSNSConfig;
  sqs?: EventModuleSQSConfig;
}
