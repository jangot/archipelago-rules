import { getAWSClientConfiguration } from '@library/shared/infrastructure/configuration/get-aws-clients-configuration';
import { IEventModuleConfig } from '@library/shared/modules/event/interface';
import { ConfigService } from '@nestjs/config';

export function getEventModuleConfiguration(configService: ConfigService): IEventModuleConfig {
  const clientConfig = getAWSClientConfiguration(configService);

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
