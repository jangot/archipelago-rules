import { SNSClientConfig } from '@aws-sdk/client-sns';
import { SQSClientConfig } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';

export function getAWSClientConfiguration(configService: ConfigService): SNSClientConfig | SQSClientConfig {
  const credentials = configService.get('AWS_PROFILE') === 'localstack' ? {
    accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID', 'test'),
    secretAccessKey: configService.get<string>('AWS_ACCESS_KEY', 'test'),
  } : undefined;

  return {
    region: configService.getOrThrow<string>('AWS_REGION'),
    endpoint: configService.getOrThrow<string>('AWS_ENDPOINT_URL'),
    credentials,
  };
}

