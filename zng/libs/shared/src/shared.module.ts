import { DynamicModule, Global, Logger } from '@nestjs/common';
import { SharedService } from './shared.service';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import { v4 as uuidv4 } from 'uuid';
import { LoggerModule, Params } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MiddlewareConfigProxy } from '@nestjs/common/interfaces';
import { getPinoTransports } from './pino.transport.config';

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
      // eslint-disable-next-line prettier/prettier
      providers: [
        EventBus,
        Logger,        
        SharedService
      ],
      // eslint-disable-next-line prettier/prettier
      exports: [
        EventBus,
        LoggerModule,
        SharedService
      ],
    };
  }
}
