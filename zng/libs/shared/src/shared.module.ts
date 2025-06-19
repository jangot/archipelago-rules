import { DynamicModule, Global, Logger } from '@nestjs/common';
import { SharedService } from './shared.service';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { LoggerModule, Params } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConfigProxy } from '@nestjs/common/interfaces';
import { getPinoTransports } from './pino.transport.config';
import { IMessagePublisher } from './common/messages/interfaces/imessagepublisher';
import { SqsMessagePublisher } from './common/messages/sqs-message-publisher';
import { SqsModule, SqsService } from '@ssut/nestjs-sqs';
import { SqsOptions } from '@ssut/nestjs-sqs/dist/sqs.types';
import { getSqsClient } from './common/messages/aws/sqs-client';

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
      ],
      exports: [
        EventBus,
        LoggerModule,
        SharedService,
        IMessagePublisher,
      ],
    };
  }
}
