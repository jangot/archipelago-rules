import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';
import { ConfigService } from '@nestjs/config';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { AllExceptionsFilter, DomainExceptionsFilter } from '@library/shared/common/filters';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // Initialize TypeORM Transactional Context
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create(NotificationModule, { abortOnError: true });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

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
