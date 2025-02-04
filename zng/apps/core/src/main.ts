/*
 * File Name   : main.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { CoreModule } from './core.module';
import * as dotenvFlow from 'dotenv-flow';
import { AllExceptionsFilter } from '@library/shared/common/filters/all-exceptions.filter';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';

dotenvFlow.config();

async function bootstrap() {
  const port = process.env.PORT || 8080;
  const app = await NestFactory.create(CoreModule);
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true
    }),
  );

  configureSwagger(app);

  // Starts listening for shutdown hooks - (https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown)
  // Suggested way to handle shutdown hooks in NestJS (needed because of HealthModule)
  //app.enableShutdownHooks();
  // This replaces the need to call app.enableShutdownHooks() and is a more robust way to handle shutdown hooks
  setupGracefulShutdown({ app });

  await app.listen(port);
}

function configureSwagger(app: INestApplication<any>) {
  const config = new DocumentBuilder()
    .setTitle('ZNG Core API')
    .setDescription('Zirtue Next Generation Platform Core API')
    .setVersion('1.0')
    .addTag('ZNG Core API')
    .build();
  
    const options: SwaggerDocumentOptions =  {
        operationIdFactory: (
          controllerKey: string,
          methodKey: string
        ) => methodKey
    };

    const document = SwaggerModule.createDocument(app, config, options);
      
    SwaggerModule.setup('api/docs', app, document);
}

bootstrap();
