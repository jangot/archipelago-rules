import { EventSubscriberServiceName } from '@library/entity/enum/event-subscriber-service-name';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SqsModule } from '@ssut/nestjs-sqs';
import { SqsOptions } from '@ssut/nestjs-sqs/dist/sqs.types';
import { registerCustomRepositoryProviders } from '../../common/data/registration.repository';
import { EventManager } from '../../common/event/event-manager';
import { getSqsClient } from '../../common/message/aws/sqs-client';
import { EventEntities } from '../../domain/entity';
import { EventRepositories } from '../../infrastructure/repository';
import { SubscriberDestination, SubscriberServiceName } from './event.constants';

@Global()
@Module({})
export class EventModule {
  public static forRoot(subscriberServiceName: EventSubscriberServiceName, subscriberDestination: string): DynamicModule {
    return {
      module: EventModule,
      imports: [
        CqrsModule,
        TypeOrmModule.forFeature(EventEntities),
        SqsModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService): Promise<SqsOptions> => {
            return {
              consumers: [{
                sqs: getSqsClient(configService),
                name: 'ZNG_Consumer',
                queueUrl: configService.get('AWS_QUEUE_URL') || 'http://localhost:4566/000000000000/test-queue',
              }],
              producers: [
                {
                  sqs: getSqsClient(configService),
                  name: 'ZNG_Producer',
                  queueUrl: configService.get('AWS_QUEUE_URL') || 'http://localhost:4566/000000000000/test-queue',
                },
              ],
            };
          },
        }),
      ],
      providers: [
        ...EventRepositories,
        ...registerCustomRepositoryProviders(EventEntities),
        EventManager,
        { provide: SubscriberServiceName, useValue: subscriberServiceName },
        { provide: SubscriberDestination, useValue: subscriberDestination },
      ],
      exports: [EventManager],
    };
  }
}
