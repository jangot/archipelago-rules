import { ConfigService } from '@nestjs/config';

export function getModuleConfiguration(configService: ConfigService) {
  // TODO check how we connect to AWS
  const clientConfig = {
    region: configService.getOrThrow<string>('AWS_REGION'),
    endpoint: configService.getOrThrow<string>('AWS_ENDPOINT_URL'),
    credentials: {
      accessKeyId: configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: configService.getOrThrow<string>('AWS_SECRET_ACCESS_KEY'),
    },
  };

  return {
    serviceName: configService.getOrThrow<string>('SERVICE_NAME'),
    sns: {
      topicArn: configService.getOrThrow<string>('AWS_EVENTS_TOPIC'),
      clientConfig,
    },
    sqs: {
      queueUrl: configService.getOrThrow<string>('AWS_QUEUE_URL'),
      clientConfig,
      maxNumberOfMessages: 10,
      waitTimeSeconds: 10,
    },
  };
}
