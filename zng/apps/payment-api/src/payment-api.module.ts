import { Module } from '@nestjs/common';
import { PaymentApiController } from './payment-api.controller';
import { PaymentApiService } from './payment-api.service';

@Module({
  imports: [],
  controllers: [PaymentApiController],
  providers: [PaymentApiService],
})
export class PaymentApiModule {}
