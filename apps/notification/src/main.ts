import { AllExceptionsFilter, DomainExceptionsFilter } from '@library/shared/common/filter';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';

import { NotificationModule } from '@notification/notification.module';

async function bootstrap() {
  // Initialize TypeORM Transactional Context
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create(NotificationModule, { abortOnError: true });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter), new DomainExceptionsFilter(httpAdapter));

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.setGlobalPrefix('/api/notification');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  configureSwagger(app);

  // Setup graceful shutdown
  setupGracefulShutdown({ app });

  await app.listen(port);
}

function configureSwagger(app: any) {
  const config = new DocumentBuilder()

    .setTitle('ZNG Notification API')
    .setDescription('Zirtue Next Generation Platform Notification API')
    .setVersion('1.0')
    .addTag('ZNG Notification API')
    .build();

  const options: SwaggerDocumentOptions = { operationIdFactory: (controllerKey: string, methodKey: string) => methodKey };

  const document = SwaggerModule.createDocument(app, config, options);

  SwaggerModule.setup('api/notification/docs', app, document);
}

void bootstrap();
