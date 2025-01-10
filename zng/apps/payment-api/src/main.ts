import { NestFactory } from '@nestjs/core';
import { PaymentApiModule } from './payment-api.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentApiModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
