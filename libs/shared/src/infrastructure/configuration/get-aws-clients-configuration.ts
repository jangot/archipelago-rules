import { SNSClientConfig } from '@aws-sdk/client-sns';
import { SQSClientConfig } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';

export function getAWSClientConfiguration(configService: ConfigService): SNSClientConfig | SQSClientConfig {
  const isLocal = configService.get('IS_LOCAL') === '1';
  const credentials = isLocal ? {
    accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID', 'test'),
    secretAccessKey: configService.get<string>('AWS_ACCESS_KEY', 'test'),
  } : undefined;

  return {
    region: configService.getOrThrow<string>('AWS_REGION'),
    endpoint: isLocal ? configService.getOrThrow<string>('AWS_ENDPOINT_URL') : undefined,
    credentials,
  };
}

