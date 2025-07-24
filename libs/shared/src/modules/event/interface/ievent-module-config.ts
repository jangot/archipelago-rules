import { SNSClientConfig } from '@aws-sdk/client-sns';
import { SQSClientConfig } from '@aws-sdk/client-sqs';

export interface EventModuleSNSConfig {
  topicArn: string,
  clientConfig: SNSClientConfig,
}

export interface EventModuleSQSConfig {
  queueUrl: string;
  clientConfig: SQSClientConfig;
  maxNumberOfMessages: number;
  waitTimeSeconds: number;
}

export interface IEventModuleConfig {
  serviceName: string;
  sns?: EventModuleSNSConfig;
  sqs?: EventModuleSQSConfig;
}
