import { SNSClientConfig } from '@aws-sdk/client-sns';
import { SQSClientConfig } from '@aws-sdk/client-sqs';

export interface EventsModuleSNSConfig {
  topicArn: string,
  clientConfig: SNSClientConfig,
}

export interface EventsModuleSQSConfig {
  queueUrl: string;
  clientConfig: SQSClientConfig;
  maxNumberOfMessages?: number;
  waitTimeSeconds?: number;
}

export interface IEventsModuleConfig {
  serviceName: string;
  sns?: EventsModuleSNSConfig;
  sqs?: EventsModuleSQSConfig;
  isGlobal?: boolean;
}
