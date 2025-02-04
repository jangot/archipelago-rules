/*
 * File Name   : core.module.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { LoggerMiddleware } from '@library/shared/common/middleware/logger-middleware';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { LoggerModule } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from '@library/shared/common/health/health.module';

@Module({
  imports: [
    // Might want to create a Global module (using @Global) to bring in common stuff
    // GlobalModule, ???
    GracefulShutdownModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'debug',
        genReqId: (request) => request.headers['x-correlation-id'] || uuidv4(),
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: process.env.COLORIZE_LOGS == 'true' || false,
                singleLine: true,
                levelFirst: false,
                translateTime: "yyyy-mm-dd'T'HH:MM:ss'Z'",
                //ignore: 'pid,hostname,res,responseTime,req.query,req.params,req.headers,req.body,req.route,req.host,req.remoteAddress,req.remotePort',
                errorLikeObjectKeys: ['err', 'error'],
            }
        }
      }
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        synchronize: process.env.NODE_ENV === 'development', // Don't synchronize in Prod!!!
        autoLoadEntities: true,
        logging: process.env.TYPE_ORM_LOGGING == 'true' ? ["query", "error"] : false
      })
    }),
    HealthModule
  ],
  controllers: [CoreController],
  providers: [Logger, CoreService],
})

export class CoreModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
