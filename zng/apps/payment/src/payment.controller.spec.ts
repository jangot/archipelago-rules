import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

// Follow ZNG testing guidelines from .github/copilot/test-instructions.md
// Use real service implementations for integration tests (2-3 levels deep)
describe('PaymentController', () => {
  let paymentController: PaymentController;
  let paymentService: PaymentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            getHello: jest.fn().mockReturnValue('Hello World!'),
          },
        },
      ],
    }).compile();

    paymentController = module.get<PaymentController>(PaymentController);
    paymentService = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return Hello World message when service is available', () => {
      // Act
      const result = paymentController.getHello();

      // Assert
      expect(result).toBe('Hello World!');
      expect(paymentService.getHello).toHaveBeenCalledTimes(1);
    });

    it('should delegate to PaymentService for health check', () => {
      // Act
      paymentController.getHello();

      // Assert
      expect(paymentService.getHello).toHaveBeenCalled();
    });
  });
});
