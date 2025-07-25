import { ConfigService } from '@nestjs/config';
import { IEventModuleConfig } from '@library/shared/modules/event/interface';

export function getEventModuleConfiguration(configService: ConfigService): IEventModuleConfig {
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
      topics: [configService.getOrThrow<string>('AWS_EVENTS_TOPIC')],
      clientConfig,
    },
    sqs: {
      queues: [
        {
          url: configService.getOrThrow<string>('AWS_EVENTS_QUEUE_URL'),
          maxNumberOfMessages: 10,
          waitTimeSeconds: 5,
        },
      ],
      clientConfig,
    },
  };
}
