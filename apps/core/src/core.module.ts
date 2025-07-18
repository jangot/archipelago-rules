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
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { CoreModules } from './index.modules';

@Module({
  imports: [
    CqrsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    GracefulShutdownModule.forRoot(),
    // Bring in Shared stuff like pino Logger properly configured, more to follow
    SharedModule.forRoot([CoreController]),
    EventModule.forRoot('core', '<url to core event handler endpoint>'),
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
