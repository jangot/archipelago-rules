import { NestFactory } from '@nestjs/core';
import { NotificationApiModule } from './notification-api.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationApiModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
