/*
 * File Name   : core.module.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { SharedModule } from '@library/shared';
import { HealthModule } from '@library/shared/common/health/health.module';
import { LoggerMiddleware } from '@library/shared/common/middleware/logger-middleware';
import { EventModule } from '@library/shared/modules/events/event.module';
import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { CoreModules } from './index.modules';
import { Events2Module } from '@library/shared/modules/events2';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GracefulShutdownModule.forRoot(),
    // Bring in Shared stuff like pino Logger properly configured, more to follow
    SharedModule.forRoot([CoreController]),
    EventModule.forRoot('core', '<url to core event handler endpoint>'),
    Events2Module.forRootAsync({
      isGlobal: true,
      useFactory: (configService: ConfigService) => {
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
      },
      inject: [ConfigService],
    }),
    HealthModule,
    ...CoreModules, // Add Core specific Modules here, and they will automatically get imported
  ],
  controllers: [CoreController],
  providers: [CoreService, Logger],
  exports: [CoreService],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*path', CoreController);
  }
}
