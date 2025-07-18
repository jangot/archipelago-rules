import { DynamicModule, Global, Logger, Module } from '@nestjs/common';
import { MiddlewareConfigProxy } from '@nestjs/common/interfaces';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule, EventBus } from '@nestjs/cqrs';
import { LoggerModule, Params } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';
import { getPinoTransports } from './pino.transport.config';
import { SharedService } from './shared.service';

@Global()
@Module({})
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
      providers: [
        EventBus,
        Logger,        
        SharedService,
      ],
      exports: [
        LoggerModule,
        SharedService,
      ],
    };
  }
}
