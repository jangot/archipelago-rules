import { S3ClientConfig } from '@aws-sdk/client-s3';
import { SNSClientConfig } from '@aws-sdk/client-sns';
import { SQSClientConfig } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';

export function getAWSClientConfiguration(configService: ConfigService): S3ClientConfig | SNSClientConfig | SQSClientConfig {
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

/**
 * Gets S3-specific client configuration with additional S3-specific options.
 */
export function getS3ClientConfiguration(configService: ConfigService): S3ClientConfig {
  const baseConfig = getAWSClientConfiguration(configService) as S3ClientConfig;
  
  return {
    ...baseConfig,
    forcePathStyle: true, // Required for local development with LocalStack
  };
}

