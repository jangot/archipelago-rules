import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { ValidationPipe } from '@nestjs/common';
import { setupGracefulShutdown } from 'nestjs-graceful-shutdown';
import { ConfigService } from '@nestjs/config';
import { initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { AllExceptionsFilter, DomainExceptionsFilter } from '@library/shared/common/filter';
import { DocumentBuilder, SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  // Initialize TypeORM Transactional Context
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

  const app = await NestFactory.create(PaymentModule, { abortOnError: true });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter), new DomainExceptionsFilter(httpAdapter));

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.setGlobalPrefix('/api/payment');
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
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .setTitle('ZNG Payment API')
    .setDescription('Zirtue Next Generation Platform Payment API')
    .setVersion('1.0')
    .addTag('ZNG Payment API')
    .build();

  const options: SwaggerDocumentOptions = { operationIdFactory: (controllerKey: string, methodKey: string) => methodKey };

  const document = SwaggerModule.createDocument(app, config, options);

  SwaggerModule.setup('api/payment/docs', app, document);
}

void bootstrap();
