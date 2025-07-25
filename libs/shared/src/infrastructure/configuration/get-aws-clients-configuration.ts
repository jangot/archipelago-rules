import { ConfigService } from '@nestjs/config';
import { SNSClientConfig } from '@aws-sdk/client-sns';
import { SQSClientConfig } from '@aws-sdk/client-sqs';

export function getAwsClientsConfiguration(configService: ConfigService): SNSClientConfig | SQSClientConfig {
  // TODO check how we connect to AWS
  return {
    region: configService.getOrThrow<string>('AWS_REGION'),
    endpoint: configService.getOrThrow<string>('AWS_ENDPOINT_URL'),
    credentials: {
      accessKeyId: configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
    },
  };
}
