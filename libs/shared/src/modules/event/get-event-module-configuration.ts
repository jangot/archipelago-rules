import { ConfigService } from '@nestjs/config';
import { IEventModuleConfig } from '@library/shared/modules/event/interface';
import { getAwsClientsConfiguration } from '@library/shared/infrastructure/configuration/get-aws-clients-configuration';

export function getEventModuleConfiguration(configService: ConfigService): IEventModuleConfig {
  const clientConfig = getAwsClientsConfiguration(configService);

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
