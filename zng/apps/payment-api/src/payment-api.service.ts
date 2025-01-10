import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentApiService {
  getHello(): string {
    return 'Hello World!';
  }
}
