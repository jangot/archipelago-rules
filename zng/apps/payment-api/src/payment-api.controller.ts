import { Controller, Get } from '@nestjs/common';
import { PaymentApiService } from './payment-api.service';

@Controller()
export class PaymentApiController {
  constructor(private readonly paymentApiService: PaymentApiService) {}

  @Get()
  getHello(): string {
    return this.paymentApiService.getHello();
  }
}
