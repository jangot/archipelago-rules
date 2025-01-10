import { Test, TestingModule } from '@nestjs/testing';
import { PaymentApiController } from './payment-api.controller';
import { PaymentApiService } from './payment-api.service';

describe('PaymentApiController', () => {
  let paymentApiController: PaymentApiController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PaymentApiController],
      providers: [PaymentApiService],
    }).compile();

    paymentApiController = app.get<PaymentApiController>(PaymentApiController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(paymentApiController.getHello()).toBe('Hello World!');
    });
  });
});
