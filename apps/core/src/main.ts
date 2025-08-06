/*
 * File Name   : main.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { AllExceptionsFilter, DomainExceptionsFilter } from '@library/shared/common/filter';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { CoreModule } from './core.module';

async function bootstrap() {
  // It is required to initialize the  TypeORM Transactional Context before application creation and initialization
  // StorageDriver mode: https://github.com/Aliheym/typeorm-transactional?tab=readme-ov-file#storage-driver
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create(CoreModule, { abortOnError: true });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter), new DomainExceptionsFilter(httpAdapter));

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
  const isLocalEnvironment = configService.get<string>('NODE_ENV') === 'local';
  app.enableCors({
    origin: isLocalEnvironment
      ? true // Allow all origins in local environment for development purposes
      : (origin, callback) => { 
        const allowedDomain = /\.zirtue\.com$/;
        if (!origin || allowedDomain.test(new URL(origin).hostname)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
    credentials: true,
  });

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
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt')
    .setTitle('ZNG Core API')
    .setDescription('Zirtue Next Generation Platform Core API')
    .setVersion('1.0')
    .addTag('ZNG Core API')
    .build();

  const options: SwaggerDocumentOptions = { operationIdFactory: (controllerKey: string, methodKey: string) => methodKey };

  const document = SwaggerModule.createDocument(app, config, options);

  // Remove security from all paths that are marked with the @Public() decorator
  // This is the key that SwaggerModule looks at to determine if the endpoint is public
  // This is a workaround to remove the security from the public endpoints
  for (const path of Object.values(document.paths)) {
    for (const op of Object.values(path) as any[]) {
      if (op['x-zng-public']) {
        delete op.security;
      }
    }
  }

  SwaggerModule.setup('api/core/docs', app, document);
}

void bootstrap();
