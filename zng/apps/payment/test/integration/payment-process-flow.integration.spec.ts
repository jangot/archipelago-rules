import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
import { IDomainServices } from '../../src/domain/idomain.services';
import { PaymentModule } from '../../src/payment.module';
import { LoanPaymentModule } from '../../src/loan-payments/loan-payment.module';
import { LoanPaymentStepModule } from '../../src/loan-payment-steps/loan-payment-step.module';
import { TransferExecutionModule } from '../../src/transfer-execution/transfer-execution.module';
import { 
  ILoan,
  ILoanPayment,
  ILoanPaymentStep,
  IPaymentAccount,
  IPaymentsRoute,
  IPaymentsRouteStep,
  ITransfer,
} from '@library/entity/interface';
import {
  LoanPaymentStateCodes,
  LoanPaymentTypeCodes,
  LoanTypeCodes,
  PaymentAccountOwnershipType,
  PaymentAccountProviderCodes,
  PaymentAccountType,
  PaymentStepStateCodes,
  TransferStateCodes,
} from '@library/entity/enum';
import { DeepPartial } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { initializeTransactionalContext, patchTypeORMRepositoryWithBaseRepository } from 'typeorm-transactional';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { GracefulShutdownModule } from 'nestjs-graceful-shutdown';
import { SharedModule } from '@library/shared';
import { HealthModule } from '@library/shared/common/health/health.module';
import { LoggerErrorInterceptor } from 'nestjs-pino';
import { HttpAdapterHost } from '@nestjs/core';

describe('Payment Process Flow (E2E)', () => {
  let app: INestApplication;
  let domainServices: IDomainServices;

  // Test data
  const mockLoanId = uuidv4();
  const mockUserId = uuidv4();
  const mockLenderAccountId = uuidv4();
  const mockBorrowerAccountId = uuidv4();
  const mockBillerAccountId = uuidv4();
  const mockBillerId = uuidv4();
  
  // Mock objects that will be used by our mocked services
  const mockLoan: DeepPartial<ILoan> = {
    id: mockLoanId,
    amount: 1000,
    type: LoanTypeCodes.P2p,
    lenderAccountId: mockLenderAccountId,
    borrowerAccountId: mockBorrowerAccountId,
    billerId: mockBillerId,
    biller: {
      id: mockBillerId,
      paymentAccountId: mockBillerAccountId,
    },
  };

  const mockLenderAccount: DeepPartial<IPaymentAccount> = {
    id: mockLenderAccountId,
    userId: mockUserId,
    type: PaymentAccountType.BankAccount,
    ownership: PaymentAccountOwnershipType.Personal,
    provider: PaymentAccountProviderCodes.Checkbook,
  };

  const mockBorrowerAccount: DeepPartial<IPaymentAccount> = {
    id: mockBorrowerAccountId,
    userId: uuidv4(),
    type: PaymentAccountType.BankAccount,
    ownership: PaymentAccountOwnershipType.Personal,
    provider: PaymentAccountProviderCodes.Checkbook,
  };

  const mockBillerAccount: DeepPartial<IPaymentAccount> = {
    id: mockBillerAccountId,
    userId: mockBillerId,
    type: PaymentAccountType.BankAccount,
    ownership: PaymentAccountOwnershipType.Internal,
    provider: PaymentAccountProviderCodes.Fiserv,
  };

  beforeAll(async () => {
    // Initialize the transactional context
    initializeTransactionalContext();
    patchTypeORMRepositoryWithBaseRepository();
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CqrsModule,
        ConfigModule.forRoot({ isGlobal: true }),
        GracefulShutdownModule.forRoot(),
        SharedModule.forRoot(),
        HealthModule,
        DataModule,
        DomainModule,
        LoanPaymentModule,
        LoanPaymentStepModule,
        TransferExecutionModule,
        PaymentModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalInterceptors(new LoggerErrorInterceptor());
    app.setGlobalPrefix('/api/payment');
    
    domainServices = app.get<IDomainServices>(IDomainServices);
    
    // Mock the domain services methods
    jest.spyOn(domainServices.paymentServices, 'getLoanById').mockResolvedValue(mockLoan as ILoan);
    jest.spyOn(domainServices.paymentServices, 'getPaymentAccountById').mockImplementation(
      async (id: string) => {
        if (id === mockLenderAccountId) return mockLenderAccount as IPaymentAccount;
        if (id === mockBorrowerAccountId) return mockBorrowerAccount as IPaymentAccount;
        if (id === mockBillerAccountId) return mockBillerAccount as IPaymentAccount;
        return null;
      }
    );
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('GET /api/payment/health should return OK', () => {
      return request(app.getHttpServer())
        .get('/api/payment/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('Payment Flow', () => {
    it('should handle full payment process flow', async () => {
      // Prepare mocks for a complete payment flow
      const mockPaymentId = uuidv4();
      const mockStepId = uuidv4();
      const mockTransferId = uuidv4();
      
      const mockRouteSteps: DeepPartial<IPaymentsRouteStep>[] = [{
        id: uuidv4(),
        routeId: uuidv4(),
        order: 0,
        fromId: mockLenderAccountId,
        toId: mockBillerAccountId,
      }];

      const mockRoute: DeepPartial<IPaymentsRoute> = {
        id: uuidv4(),
        fromAccount: PaymentAccountType.BankAccount,
        fromOwnership: PaymentAccountOwnershipType.Personal,
        fromProvider: PaymentAccountProviderCodes.Checkbook,
        toAccount: PaymentAccountType.BankAccount,
        toOwnership: PaymentAccountOwnershipType.Internal,
        toProvider: PaymentAccountProviderCodes.Fiserv,
        steps: mockRouteSteps as IPaymentsRouteStep[],
      };

      const mockPaymentStep: DeepPartial<ILoanPaymentStep> = {
        id: mockStepId,
        loanPaymentId: mockPaymentId,
        state: PaymentStepStateCodes.Created,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: mockLenderAccountId,
        targetPaymentAccountId: mockBillerAccountId,
      };

      const mockPayment: DeepPartial<ILoanPayment> = {
        id: mockPaymentId,
        loanId: mockLoanId,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
        amount: 1000,
        steps: [mockPaymentStep as ILoanPaymentStep],
      };

      const mockTransfer: DeepPartial<ITransfer> = {
        id: mockTransferId,
        loanPaymentStepId: mockStepId,
        state: TransferStateCodes.Created,
        amount: 1000,
        sourceAccountId: mockLenderAccountId,
        destinationAccountId: mockBillerAccountId,
        order: 0,
      };

      // Setup for payment initiation
      jest.spyOn(domainServices.paymentServices, 'findRouteForPayment').mockResolvedValue(mockRoute as IPaymentsRoute);
      jest.spyOn(domainServices.paymentServices, 'createPayment').mockResolvedValue(mockPayment as ILoanPayment);
      jest.spyOn(domainServices.paymentServices, 'createPaymentSteps').mockResolvedValue([mockPaymentStep as ILoanPaymentStep]);
      jest.spyOn(domainServices.paymentServices, 'getLoanPaymentById').mockResolvedValue(mockPayment as ILoanPayment);
      
      // Setup for step advancement
      jest.spyOn(domainServices.paymentServices, 'getLoanPaymentStepById').mockResolvedValue(mockPaymentStep as ILoanPaymentStep);
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockImplementation(async (stepId) => {
        if (stepId === mockStepId) {
          return mockTransfer as ITransfer;
        }
        return null;
      });
      jest.spyOn(domainServices.paymentServices, 'createTransferForStep').mockResolvedValue(mockTransfer as ITransfer);
      jest.spyOn(domainServices.paymentServices, 'updatePaymentStepState').mockResolvedValue(true);

      // Setup for transfer execution
      jest.spyOn(domainServices.paymentServices, 'getTransferById').mockResolvedValue(mockTransfer as ITransfer);
      
      // 1. Initiate Funding Payment
      const initiatePaymentEndpoint = `/api/payment/loans/${mockLoanId}/payments/funding/initiate`;
      await request(app.getHttpServer())
        .post(initiatePaymentEndpoint)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.success).toBe(true);
        });

      expect(domainServices.paymentServices.getLoanById).toHaveBeenCalledWith(mockLoanId, expect.any(Array));
      expect(domainServices.paymentServices.findRouteForPayment).toHaveBeenCalled();
      expect(domainServices.paymentServices.createPayment).toHaveBeenCalled();
      expect(domainServices.paymentServices.createPaymentSteps).toHaveBeenCalled();

      // 2. Advance Payment Step
      // Update mock transfer to Completed state for the next call
      const completedTransfer = { ...mockTransfer, state: TransferStateCodes.Completed };
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValue(completedTransfer as ITransfer);
      
      const advanceStepEndpoint = `/api/payment/payment-steps/${mockStepId}/advance`;
      await request(app.getHttpServer())
        .post(advanceStepEndpoint)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.success).toBe(true);
        });

      expect(domainServices.paymentServices.getLoanPaymentStepById).toHaveBeenCalledWith(mockStepId);
      expect(domainServices.paymentServices.getLatestTransferForStep).toHaveBeenCalledWith(mockStepId);
      expect(domainServices.paymentServices.updatePaymentStepState).toHaveBeenCalledWith(
        mockStepId, 
        PaymentStepStateCodes.Completed
      );

      // 3. Advance Payment (to complete it)
      // Update mock step to Completed state and payment to reflect all steps completed
      const completedStep = { ...mockPaymentStep, state: PaymentStepStateCodes.Completed };
      const pendingPayment = { ...mockPayment, steps: [completedStep as ILoanPaymentStep], state: LoanPaymentStateCodes.Pending };
      
      jest.spyOn(domainServices.paymentServices, 'getLoanPaymentById').mockResolvedValue(pendingPayment as ILoanPayment);
      jest.spyOn(domainServices.paymentServices, 'completePayment').mockResolvedValue(true);

      const advancePaymentEndpoint = `/api/payment/payments/${mockPaymentId}/advance`;
      await request(app.getHttpServer())
        .post(advancePaymentEndpoint)
        .send({ type: LoanPaymentTypeCodes.Funding })
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.success).toBe(true);
        });

      expect(domainServices.paymentServices.getLoanPaymentById).toHaveBeenCalledWith(mockPaymentId, expect.any(Array));
      expect(domainServices.paymentServices.completePayment).toHaveBeenCalledWith(mockPaymentId);

      // 4. Initiate Disbursement Payment
      // Mock for a new payment (disbursement) with different ID
      const mockDisbursementPaymentId = uuidv4();
      const mockDisbursementStepId = uuidv4();
      const mockDisbursementTransferId = uuidv4();

      const mockDisbursementStep: DeepPartial<ILoanPaymentStep> = {
        id: mockDisbursementStepId,
        loanPaymentId: mockDisbursementPaymentId,
        state: PaymentStepStateCodes.Created,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: mockBillerAccountId,
        targetPaymentAccountId: mockBorrowerAccountId,
      };

      const mockDisbursementPayment: DeepPartial<ILoanPayment> = {
        id: mockDisbursementPaymentId,
        loanId: mockLoanId,
        type: LoanPaymentTypeCodes.Disbursement,
        state: LoanPaymentStateCodes.Created,
        amount: 1000,
        steps: [mockDisbursementStep as ILoanPaymentStep],
      };

      const mockDisbursementTransfer: DeepPartial<ITransfer> = {
        id: mockDisbursementTransferId,
        loanPaymentStepId: mockDisbursementStepId,
        state: TransferStateCodes.Created,
        amount: 1000,
        sourceAccountId: mockBillerAccountId,
        destinationAccountId: mockBorrowerAccountId,
        order: 0,
      };

      jest.spyOn(domainServices.paymentServices, 'createPayment').mockResolvedValue(mockDisbursementPayment as ILoanPayment);
      jest.spyOn(domainServices.paymentServices, 'createPaymentSteps').mockResolvedValue([mockDisbursementStep as ILoanPaymentStep]);
      
      const initiateDisbursementEndpoint = `/api/payment/loans/${mockLoanId}/payments/disbursement/initiate`;
      await request(app.getHttpServer())
        .post(initiateDisbursementEndpoint)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.success).toBe(true);
        });

      expect(domainServices.paymentServices.getLoanById).toHaveBeenCalledWith(mockLoanId, expect.any(Array));
      expect(domainServices.paymentServices.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          loanId: mockLoanId,
          type: LoanPaymentTypeCodes.Disbursement,
        })
      );
      
      // This test shows how all the steps in the payment process flow would work together
      // In a real-world scenario, additional tests for error cases would be needed
    });
  });
});
