import { SNSClientConfig } from '@aws-sdk/client-sns';
import { SQSClientConfig } from '@aws-sdk/client-sqs';

export interface EventsModuleConfig {
  serviceName: string;
  sns?: {
    topicArn: string,
    config: SNSClientConfig,
  };
  sqs?: SQSClientConfig;
}
