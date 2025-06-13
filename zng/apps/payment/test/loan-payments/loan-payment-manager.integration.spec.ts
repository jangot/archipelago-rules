import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
import { IDomainServices } from '../../src/domain/idomain.services';
import { LoanPaymentFactory } from '../../src/loan-payments/loan-payment.factory';
import { 
  FundingPaymentManager,
  DisbursementPaymentManager,
  RepaymentPaymentManager,
  FeePaymentManager,
  RefundPaymentManager,
} from '../../src/loan-payments/managers';
import { 
  ILoan, 
  ILoanPayment, 
  IPaymentsRoute, 
  IPaymentsRouteStep,
  IPaymentAccount,
} from '@library/entity/interface';
import { 
  LoanPaymentType, 
  LoanPaymentTypeCodes, 
  LoanPaymentState, 
  LoanPaymentStateCodes,
  PaymentAccountType,
  PaymentAccountOwnershipType,
  PaymentAccountProvider,
  PaymentAccountProviderCodes,
  PaymentStepState,
  PaymentStepStateCodes,
  TransferStateCodes,
  LoanType,
  LoanTypeCodes,
} from '@library/entity/enum';
import { DeepPartial } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { initializeTransactionalContext, patchTypeORMRepositoryWithBaseRepository } from 'typeorm-transactional';
import { MockType } from '../testing-utils';
import { LoanPaymentStepModule } from '../../src/loan-payment-steps/loan-payment-step.module';
import { TransferExecutionModule } from '../../src/transfer-execution/transfer-execution.module';

describe('Loan Payment Managers Integration', () => {
  let domainServices: IDomainServices;
  let fundingManager: FundingPaymentManager;
  let disbursementManager: DisbursementPaymentManager;
  let repaymentManager: RepaymentPaymentManager;
  let feeManager: FeePaymentManager;
  let refundManager: RefundPaymentManager;
  let loanPaymentFactory: LoanPaymentFactory;

  // Test data
  const mockLoanId = uuidv4();
  const mockLenderAccountId = uuidv4();
  const mockBorrowerAccountId = uuidv4();
  const mockBillerAccountId = uuidv4();
  const mockBillerId = uuidv4();
  const mockRouteId = uuidv4();
  const mockStepId = uuidv4();
  const mockPaymentId = uuidv4();
  const mockTransferId = uuidv4();

  // Mock objects
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

  const mockPaymentAccount: DeepPartial<IPaymentAccount> = {
    id: mockLenderAccountId,
    type: PaymentAccountType.BankAccount,
    ownership: PaymentAccountOwnershipType.Personal,
    provider: PaymentAccountProviderCodes.Checkbook,
  };

  const mockRouteStep: DeepPartial<IPaymentsRouteStep> = {
    id: mockStepId,
    routeId: mockRouteId,
    order: 0,
    fromId: mockLenderAccountId,
    toId: mockBillerAccountId,
  };

  const mockRoute: DeepPartial<IPaymentsRoute> = {
    id: mockRouteId,
    fromAccount: PaymentAccountType.BankAccount,
    fromOwnership: PaymentAccountOwnershipType.Personal,
    fromProvider: PaymentAccountProviderCodes.Checkbook,
    toAccount: PaymentAccountType.BankAccount,
    toOwnership: PaymentAccountOwnershipType.Internal,
    toProvider: PaymentAccountProviderCodes.Fiserv,
    steps: [mockRouteStep as IPaymentsRouteStep],
  };

  const mockPayment: DeepPartial<ILoanPayment> = {
    id: mockPaymentId,
    amount: 1000,
    loanId: mockLoanId,
    type: LoanPaymentTypeCodes.Funding,
    state: LoanPaymentStateCodes.Created,
  };

  beforeAll(async () => {
    // Initialize the transactional context
    initializeTransactionalContext();
    patchTypeORMRepositoryWithBaseRepository();
  });

  beforeEach(async () => {
    // Create a testing module with real implementations
    // but with mocked repositories injected via DataModule
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DataModule,
        DomainModule,
        LoanPaymentStepModule,
        TransferExecutionModule,
      ],
      providers: [
        LoanPaymentFactory,
        FundingPaymentManager,
        DisbursementPaymentManager,
        RepaymentPaymentManager,
        FeePaymentManager,
        RefundPaymentManager,
      ],
    }).compile();

    domainServices = module.get<IDomainServices>(IDomainServices);
    fundingManager = module.get<FundingPaymentManager>(FundingPaymentManager);
    disbursementManager = module.get<DisbursementPaymentManager>(DisbursementPaymentManager);
    repaymentManager = module.get<RepaymentPaymentManager>(RepaymentPaymentManager);
    feeManager = module.get<FeePaymentManager>(FeePaymentManager);
    refundManager = module.get<RefundPaymentManager>(RefundPaymentManager);
    loanPaymentFactory = module.get<LoanPaymentFactory>(LoanPaymentFactory);

    // Setup spies on domain services
    jest.spyOn(domainServices.paymentServices, 'getLoanById').mockResolvedValue(mockLoan as ILoan);
    jest.spyOn(domainServices.paymentServices, 'getPaymentAccountById').mockResolvedValue(mockPaymentAccount as IPaymentAccount);
    jest.spyOn(domainServices.paymentServices, 'findRouteForPayment').mockResolvedValue(mockRoute as IPaymentsRoute);
    jest.spyOn(domainServices.paymentServices, 'createPayment').mockResolvedValue(mockPayment as ILoanPayment);
    jest.spyOn(domainServices.paymentServices, 'createPaymentSteps').mockImplementation(async (steps) => steps as ILoanPaymentStep[]);
    jest.spyOn(domainServices.paymentServices, 'updatePaymentStepState').mockResolvedValue(true);
    jest.spyOn(domainServices.paymentServices, 'updatePayment').mockResolvedValue(true);
    jest.spyOn(domainServices.paymentServices, 'completePayment').mockResolvedValue(true);
    jest.spyOn(domainServices.paymentServices, 'failPayment').mockResolvedValue(true);
    jest.spyOn(domainServices.paymentServices, 'getLoanPaymentById').mockResolvedValue(mockPayment as ILoanPayment);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LoanPaymentFactory', () => {
    it('should provide the correct manager for each payment type', () => {
      expect(loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding)).toBe(fundingManager);
      expect(loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement)).toBe(disbursementManager);
      expect(loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment)).toBe(repaymentManager);
      expect(loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee)).toBe(feeManager);
      expect(loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund)).toBe(refundManager);
    });

    it('should throw an error for unsupported payment type', () => {
      expect(() => loanPaymentFactory.getManager('unsupported' as LoanPaymentType)).toThrow();
    });
  });

  describe('FundingPaymentManager', () => {
    it('should successfully initiate a funding payment', async () => {
      const result = await fundingManager.initiate(mockLoanId);
      
      expect(result).toBeTruthy();
      expect(domainServices.paymentServices.getLoanById).toHaveBeenCalledWith(
        mockLoanId,
        expect.any(Array)
      );
      expect(domainServices.paymentServices.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          loanId: mockLoanId,
          type: LoanPaymentTypeCodes.Funding,
        })
      );
      expect(domainServices.paymentServices.createPaymentSteps).toHaveBeenCalled();
    });

    it('should handle missing lender account', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLoanById').mockResolvedValueOnce({
        ...mockLoan,
        lenderAccountId: null,
      } as ILoan);

      const result = await fundingManager.initiate(mockLoanId);
      
      expect(result).toBeNull();
    });

    it('should handle missing biller account', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLoanById').mockResolvedValueOnce({
        ...mockLoan,
        biller: null,
      } as ILoan);

      const result = await fundingManager.initiate(mockLoanId);
      
      expect(result).toBeNull();
    });

    it('should handle duplicate payment', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLoanById').mockResolvedValueOnce({
        ...mockLoan,
        payments: [{ ...mockPayment, type: LoanPaymentTypeCodes.Funding } as ILoanPayment],
      } as ILoan);

      const result = await fundingManager.initiate(mockLoanId);
      
      expect(result).toBeNull();
    });
  });

  describe('DisbursementPaymentManager', () => {
    it('should successfully initiate a disbursement payment', async () => {
      jest.spyOn(domainServices.paymentServices, 'createPayment').mockResolvedValueOnce({
        ...mockPayment,
        type: LoanPaymentTypeCodes.Disbursement,
      } as ILoanPayment);

      const result = await disbursementManager.initiate(mockLoanId);
      
      expect(result).toBeTruthy();
      expect(domainServices.paymentServices.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          loanId: mockLoanId,
          type: LoanPaymentTypeCodes.Disbursement,
        })
      );
    });
  });

  describe('RepaymentPaymentManager', () => {
    it('should successfully initiate a repayment payment', async () => {
      jest.spyOn(domainServices.paymentServices, 'createPayment').mockResolvedValueOnce({
        ...mockPayment,
        type: LoanPaymentTypeCodes.Repayment,
        paymentNumber: 1,
      } as ILoanPayment);

      jest.spyOn(domainServices.paymentServices, 'saveRepaymentPlan').mockResolvedValueOnce([
        {
          ...mockPayment,
          type: LoanPaymentTypeCodes.Repayment,
          paymentNumber: 1,
        } as ILoanPayment,
      ]);

      const result = await repaymentManager.initiate(mockLoanId);
      
      expect(result).toBeTruthy();
      expect(Array.isArray(result)).toBeTruthy();
      expect(domainServices.paymentServices.saveRepaymentPlan).toHaveBeenCalled();
    });
  });

  describe('Loan Payment State Management', () => {
    beforeEach(() => {
      jest.spyOn(domainServices.paymentServices, 'getLoanPaymentById').mockResolvedValue({
        ...mockPayment,
        steps: [
          {
            id: mockStepId,
            loanPaymentId: mockPaymentId,
            state: PaymentStepStateCodes.Completed,
            order: 0,
            transfers: [
              {
                id: mockTransferId,
                state: TransferStateCodes.Completed,
              },
            ],
          },
        ],
      } as ILoanPayment);
    });

    it('should complete a payment when all steps are completed', async () => {
      const result = await fundingManager.advance(mockPaymentId);
      
      expect(result).toBeTruthy();
      expect(domainServices.paymentServices.completePayment).toHaveBeenCalledWith(mockPaymentId);
    });

    it('should fail a payment when a step has failed', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLoanPaymentById').mockResolvedValueOnce({
        ...mockPayment,
        steps: [
          {
            id: mockStepId,
            loanPaymentId: mockPaymentId,
            state: PaymentStepStateCodes.Failed,
            order: 0,
            transfers: [
              {
                id: mockTransferId,
                state: TransferStateCodes.Failed,
              },
            ],
          },
        ],
      } as ILoanPayment);

      const result = await fundingManager.advance(mockPaymentId);
      
      expect(result).toBeTruthy();
      expect(domainServices.paymentServices.failPayment).toHaveBeenCalledWith(mockPaymentId, mockStepId);
    });

    it('should start the next step when ready', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLoanPaymentById').mockResolvedValueOnce({
        ...mockPayment,
        state: LoanPaymentStateCodes.Created,
        steps: [
          {
            id: mockStepId,
            loanPaymentId: mockPaymentId,
            state: PaymentStepStateCodes.Created,
            order: 0,
          },
          {
            id: uuidv4(),
            loanPaymentId: mockPaymentId,
            state: PaymentStepStateCodes.Created,
            order: 1,
          },
        ],
      } as ILoanPayment);

      jest.spyOn(domainServices.management, 'advancePaymentStep').mockResolvedValueOnce(true);

      const result = await fundingManager.advance(mockPaymentId);
      
      expect(result).toBeTruthy();
      expect(domainServices.management.advancePaymentStep).toHaveBeenCalledWith(mockStepId, PaymentStepStateCodes.Created);
      expect(domainServices.paymentServices.updatePayment).toHaveBeenCalledWith(
        mockPaymentId, 
        { state: LoanPaymentStateCodes.Pending }
      );
    });

    it('should handle payments with no steps', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLoanPaymentById').mockResolvedValueOnce({
        ...mockPayment,
        steps: [],
      } as ILoanPayment);

      const result = await fundingManager.advance(mockPaymentId);
      
      expect(result).toBeTruthy();
      expect(domainServices.paymentServices.completePayment).toHaveBeenCalledWith(mockPaymentId);
    });
  });
});
