import { DynamicModule, Global, Logger } from '@nestjs/common';
import { MiddlewareConfigProxy } from '@nestjs/common/interfaces';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import { SqsModule } from '@ssut/nestjs-sqs';
import { SqsOptions } from '@ssut/nestjs-sqs/dist/sqs.types';
import { LoggerModule, Params } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';
import { EventManager } from './common/event/event-manager';
import { IEventPublisher } from './common/event/interface/ieventpublisher';
import { getSqsClient } from './common/message/aws/sqs-client';
import { IMessagePublisher } from './common/message/interface/imessagepublisher';
import { SqsMessagePublisher } from './common/message/sqs-message-publisher';
import { getPinoTransports } from './pino.transport.config';
import { SharedService } from './shared.service';

@Global()
export class SharedModule {
  /**
   * Dynamically configure LoggerModule with additional routes/controllers.
   * @param additionalRoutes - Extra routes/controllers to log
   */
  public static forRoot(additionalRoutes: Parameters<MiddlewareConfigProxy['forRoutes']> = []): DynamicModule {
    return {
      module: SharedModule,
      imports: [
        CqrsModule,
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
        LoggerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService): Promise<Params> => {
            const logLevel = configService.get('LOG_LEVEL');
            return {
              pinoHttp: {
                autoLogging: false,
                level: logLevel || 'debug',
                genReqId: (request) => request.headers['x-correlation-id'] || uuidv4(),
                transport: { targets: getPinoTransports(configService) },
              },
              forRoutes: ['*path', ...additionalRoutes], // Allow additional routes
            };
          },
        }),
      ],
      providers: [
        EventBus,
        Logger,        
        SharedService,
        { provide: IMessagePublisher, useClass: SqsMessagePublisher },
        { provide: IEventPublisher, useClass: EventManager },
      ],
      exports: [
        LoggerModule,
        SharedService,
        IEventPublisher,
      ],
    };
  }
}
