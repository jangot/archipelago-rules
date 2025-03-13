/*
 * File Name   : main.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { CoreModule } from './core.module';
import { AllExceptionsFilter } from '@library/shared/common/filters/all-exceptions.filter';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';
import { ConfigService } from '@nestjs/config';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';

async function bootstrap() {
  // It is required to initialize the  TypeORM Transactional Context before application creation and initialization
  // StorageDriver mode: https://github.com/Aliheym/typeorm-transactional?tab=readme-ov-file#storage-driver
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create(CoreModule, { abortOnError: true });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.setGlobalPrefix('/api/core');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Removes unknown properties
      forbidNonWhitelisted: true, // Rejects requests with extra fields
      transform: true, // Automatically transforms types
    })
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
    .addBearerAuth()
    .setTitle('ZNG Core API')
    .setDescription('Zirtue Next Generation Platform Core API')
    .setVersion('1.0')
    .addTag('ZNG Core API')
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };

  const document = SwaggerModule.createDocument(app, config, options);

  SwaggerModule.setup('api/core/docs', app, document);
}

void bootstrap();
