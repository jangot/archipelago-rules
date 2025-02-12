import { DynamicModule, Global, HttpException, Logger } from '@nestjs/common';
import { SharedService } from './shared.service';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { LoggerModule, Params } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConfigProxy } from '@nestjs/common/interfaces';

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
        LoggerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService): Promise<Params> => {
            return {
              pinoHttp: {
                level: configService.get('LOG_LEVEL') || 'debug',
                genReqId: (request) => request.headers['x-correlation-id'] || uuidv4(),
                transport: {
                  target: 'pino-pretty',
                  options: {
                    colorize: configService.get('COLORIZE_LOGS') === 'true',
                    singleLine: true,
                    levelFirst: false,
                    translateTime: "yyyy-mm-dd'T'HH:MM:ss'Z'",
                    ignore: 'pid,hostname,res,responseTime,req.query,req.params,req.headers,req.body,req.route,req.host,req.remoteAddress,req.remotePort',
                    errorLikeObjectKeys: ['err', 'error'],
                  },
                },
              },
              forRoutes: ['*path', ...additionalRoutes], // Allow additional routes
            };
          },
        }),
      ],
      providers: [
        EventBus,
        Logger,        
        SharedService
      ],
      exports: [
        EventBus,
        LoggerModule,
        SharedService
      ],
    };
  }
}
