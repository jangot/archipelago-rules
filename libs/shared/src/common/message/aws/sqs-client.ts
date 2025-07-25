import { SQSClient } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';

export function getSqsClient(configService: ConfigService): SQSClient {
  return new SQSClient({
    region: configService.getOrThrow<string>('AWS_REGION'),
    // Credentials are only needed for localstack (local development)
    profile: configService.get('IS_LOCAL') === '1' ? configService.get<string>('AWS_PROFILE') || 'localstack' : undefined,
  });
}
