import { getAWSClientConfiguration } from '@library/shared/infrastructure/configuration/get-aws-clients-configuration';
import { IEventModuleConfig } from '@library/shared/modules/event/interface';
import { ConfigService } from '@nestjs/config';

export function getEventModuleConfiguration(configService: ConfigService): IEventModuleConfig {
  const clientConfig = getAWSClientConfiguration(configService);

  const topic = configService.get<string>('SERVICE_NAME');
  const queueUrl = configService.get<string>('AWS_EVENTS_QUEUE_URL');

  const sns = topic ? { topics: [topic], clientConfig } : undefined;
  const sqs = queueUrl ? {
    queues: [
      {
        url: queueUrl,
        maxNumberOfMessages: 10,
        waitTimeSeconds: 5,
      },
    ],
    clientConfig,
  } : undefined;

  return {
    serviceName: configService.getOrThrow<string>('SERVICE_NAME'),
    sns,
    sqs,
  };
}
