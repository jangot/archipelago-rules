import { SNSClientConfig } from '@aws-sdk/client-sns';
import { SQSClientConfig } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';

export function getAwsClientsConfiguration(configService: ConfigService): SNSClientConfig | SQSClientConfig {
  return {
    region: configService.getOrThrow<string>('AWS_REGION'),
    endpoint: configService.getOrThrow<string>('AWS_ENDPOINT_URL'),
  };
}
