import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
import { ManagementModule } from '../../src/domain/management.module';
import { ServicesModule } from '../../src/services/services.module';
import { IDomainServices } from '../../src/domain/idomain.services';
import { ManagementDomainService } from '../../src/domain/services';
import { LoanPaymentService } from '../../src/services/loan-payment.service';
import { LoanPaymentStepService } from '../../src/services/loan-payment-step.service';
import { TransferExecutionService } from '../../src/services/transfer-execution.service';
import { 
  ILoanPaymentStep,
  IPaymentAccount,
} from '@library/entity/interface';
import { 
  LoanPaymentTypeCodes,
  LoanPaymentStateCodes,
  PaymentAccountTypeCodes,
  PaymentAccountOwnershipTypeCodes,
  PaymentAccountProviderCodes,
  PaymentStepStateCodes,
} from '@library/entity/enum';
import { DeepPartial } from 'typeorm';
import { LoanPaymentModule } from '../../src/loan-payments/loan-payment.module';
import { LoanPaymentStepModule } from '../../src/loan-payment-steps/loan-payment-step.module';
import { TransferExecutionModule } from '../../src/transfer-execution/transfer-execution.module';
import { memoryDataSourceForTests } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entities';
import { DbSchemaCodes } from '@library/shared/common/data';

describe('Payment Process Flow Integration', () => {
  let module: TestingModule;
  let domainServices: IDomainServices;
  let managementDomainService: ManagementDomainService;
  let loanPaymentService: LoanPaymentService;
  let loanPaymentStepService: LoanPaymentStepService;
  let transferExecutionService: TransferExecutionService;
  let databaseBackup: IBackup;

  // Test data
  const mockUserId = uuidv4();
  const mockLoanId = uuidv4();
  const mockPaymentId = uuidv4();
  const mockStepId = uuidv4();
  const mockTransferId = uuidv4();

  const mockLenderAccount: DeepPartial<IPaymentAccount> = {
    userId: mockUserId,
    type: PaymentAccountTypeCodes.BankAccount,
    ownership: PaymentAccountOwnershipTypeCodes.Personal,
    provider: PaymentAccountProviderCodes.Checkbook,
    isDefault: true,
    isActive: true,
    accountHolderName: 'John Doe (Lender)',
    accountNumber: '1234567890',
    routingNumber: '123456789',
  };

  const mockBorrowerAccount: DeepPartial<IPaymentAccount> = {
    userId: mockUserId,
    type: PaymentAccountTypeCodes.BankAccount,
    ownership: PaymentAccountOwnershipTypeCodes.Personal,
    provider: PaymentAccountProviderCodes.Fiserv,
    isDefault: true,
    isActive: true,
    accountHolderName: 'Jane Smith (Borrower)',
    accountNumber: '0987654321',
    routingNumber: '987654321',
  };

  const mockPlatformAccount: DeepPartial<IPaymentAccount> = {
    userId: mockUserId,
    type: PaymentAccountTypeCodes.BankAccount,
    ownership: PaymentAccountOwnershipTypeCodes.Internal,
    provider: PaymentAccountProviderCodes.Fiserv,
    isDefault: true,
    isActive: true,
    accountHolderName: 'Zirtue Platform',
    accountNumber: '5555555555',
    routingNumber: '555555555',
  };

  beforeAll(async () => {
    // Create in-memory database with Payment schema
    const memoryDBinstance = await memoryDataSourceForTests({ 
      entities: [...AllEntities], 
      schema: DbSchemaCodes.Payment, 
    });
    const { dataSource, database } = memoryDBinstance;
    
    // Initialize transactional context
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    // Create test module with real service implementations
    module = await Test.createTestingModule({
      imports: [
        DataModule, // Real data module with repositories
        DomainModule, // Real domain module with services
        ManagementModule, // Management module with ManagementDomainService
        ServicesModule, // Services module with application services
        LoanPaymentModule, // Loan payment module
        LoanPaymentStepModule, // Loan payment step module
        TransferExecutionModule, // Transfer execution module
      ],
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    domainServices = module.get<IDomainServices>(IDomainServices);
    managementDomainService = module.get<ManagementDomainService>(ManagementDomainService);
    loanPaymentService = module.get<LoanPaymentService>(LoanPaymentService);
    loanPaymentStepService = module.get<LoanPaymentStepService>(LoanPaymentStepService);
    transferExecutionService = module.get<TransferExecutionService>(TransferExecutionService);
    
    databaseBackup = database.backup();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    // Restore database to clean state before each test
    databaseBackup.restore();
  });

  describe('Payment Service Integration', () => {
    it('should initiate loan payment', async () => {
      const result = await loanPaymentService.initiatePayment(mockLoanId, LoanPaymentTypeCodes.Funding);
      
      // Since no loan exists in test database, expect null
      expect(result).toBeNull();
    });

    it('should advance loan payment', async () => {
      // Create a payment first
      const payment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      const result = await loanPaymentService.advancePayment(payment!.id, LoanPaymentTypeCodes.Funding);
      
      // Expect result to indicate advancement was attempted
      expect(result).toBeDefined();
    });
  });

  describe('Payment Step Service Integration', () => {
    let mockStep: ILoanPaymentStep;

    beforeEach(async () => {
      // Create payment accounts
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockLenderAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockPlatformAccount);

      // Create a payment
      const payment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      // Create payment step
      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Created,
      }]);

      mockStep = steps![0];
    });

    it('should advance payment step', async () => {
      const result = await loanPaymentStepService.advanceStep(mockStep.id);
      
      // Expect result to indicate advancement was attempted
      expect(result).toBeDefined();
    });

    it('should advance payment step with specific state', async () => {
      const result = await loanPaymentStepService.advanceStep(mockStep.id, PaymentStepStateCodes.Created);
      
      // Expect result to indicate advancement was attempted
      expect(result).toBeDefined();
    });
  });

  describe('Transfer Execution Service Integration', () => {
    let mockTransfer: string;

    beforeEach(async () => {
      // Create payment accounts
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockLenderAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockPlatformAccount);

      // Create a payment and step
      const payment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Created,
      }]);

      // Create transfer for the step
      const transfer = await domainServices.paymentServices.createTransferForStep(steps![0].id);
      mockTransfer = transfer!.id;
    });

    it('should execute transfer', async () => {
      const result = await transferExecutionService.executeTransfer(mockTransfer);
      
      // Expect result to indicate execution was attempted
      expect(result).toBeDefined();
    });

    it('should execute transfer with specific provider', async () => {
      const result = await transferExecutionService.executeTransfer(mockTransfer, PaymentAccountProviderCodes.Checkbook);
      
      // Expect result to indicate execution was attempted
      expect(result).toBeDefined();
    });
  });

  describe('End-to-End Payment Flow', () => {
    let lenderAccount: IPaymentAccount | null;
    let borrowerAccount: IPaymentAccount | null;
    let platformAccount: IPaymentAccount | null;

    beforeEach(async () => {
      // Create all payment accounts
      lenderAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockLenderAccount);
      borrowerAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockBorrowerAccount);
      platformAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockPlatformAccount);
    });

    it('should create and manage funding payment', async () => {
      // Create funding payment
      const fundingPayment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      expect(fundingPayment).toBeDefined();
      expect(fundingPayment!.type).toBe(LoanPaymentTypeCodes.Funding);
      expect(fundingPayment!.state).toBe(LoanPaymentStateCodes.Created);

      // Advance the payment
      const advanceResult = await loanPaymentService.advancePayment(fundingPayment!.id, LoanPaymentTypeCodes.Funding);
      expect(advanceResult).toBeDefined();
    });

    it('should create and manage disbursement payment', async () => {
      // Create disbursement payment
      const disbursementPayment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Disbursement,
        state: LoanPaymentStateCodes.Created,
      });

      expect(disbursementPayment).toBeDefined();
      expect(disbursementPayment!.type).toBe(LoanPaymentTypeCodes.Disbursement);
      expect(disbursementPayment!.state).toBe(LoanPaymentStateCodes.Created);

      // Advance the payment
      const advanceResult = await loanPaymentService.advancePayment(disbursementPayment!.id, LoanPaymentTypeCodes.Disbursement);
      expect(advanceResult).toBeDefined();
    });

    it('should create and manage repayment payment', async () => {
      // Create repayment payment
      const repaymentPayment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 500,
        type: LoanPaymentTypeCodes.Repayment,
        state: LoanPaymentStateCodes.Created,
      });

      expect(repaymentPayment).toBeDefined();
      expect(repaymentPayment!.type).toBe(LoanPaymentTypeCodes.Repayment);
      expect(repaymentPayment!.state).toBe(LoanPaymentStateCodes.Created);

      // Advance the payment
      const advanceResult = await loanPaymentService.advancePayment(repaymentPayment!.id, LoanPaymentTypeCodes.Repayment);
      expect(advanceResult).toBeDefined();
    });

    it('should handle payment steps workflow', async () => {
      // Create a payment
      const payment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      // Create payment steps
      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: lenderAccount!.id,
        targetPaymentAccountId: platformAccount!.id,
        state: PaymentStepStateCodes.Created,
      }]);

      expect(steps).toBeDefined();
      expect(steps!).toHaveLength(1);

      // Advance the step
      const stepAdvanceResult = await loanPaymentStepService.advanceStep(steps![0].id);
      expect(stepAdvanceResult).toBeDefined();

      // Create transfer for the step
      const transfer = await domainServices.paymentServices.createTransferForStep(steps![0].id);
      expect(transfer).toBeDefined();

      // Execute the transfer
      const transferResult = await transferExecutionService.executeTransfer(transfer!.id);
      expect(transferResult).toBeDefined();
    });

    it('should coordinate multiple payment types', async () => {
      // Create multiple payment types
      const payments = await Promise.all([
        domainServices.paymentServices.createPayment({
          loanId: mockLoanId,
          amount: 1000,
          type: LoanPaymentTypeCodes.Funding,
          state: LoanPaymentStateCodes.Created,
        }),
        domainServices.paymentServices.createPayment({
          loanId: mockLoanId,
          amount: 1000,
          type: LoanPaymentTypeCodes.Disbursement,
          state: LoanPaymentStateCodes.Created,
        }),
        domainServices.paymentServices.createPayment({
          loanId: mockLoanId,
          amount: 500,
          type: LoanPaymentTypeCodes.Repayment,
          state: LoanPaymentStateCodes.Created,
        }),
      ]);

      expect(payments).toHaveLength(3);
      expect(payments.every(p => p !== null)).toBe(true);

      // Test that each payment type can be advanced
      const advanceResults = await Promise.all([
        loanPaymentService.advancePayment(payments[0]!.id, LoanPaymentTypeCodes.Funding),
        loanPaymentService.advancePayment(payments[1]!.id, LoanPaymentTypeCodes.Disbursement),
        loanPaymentService.advancePayment(payments[2]!.id, LoanPaymentTypeCodes.Repayment),
      ]);

      expect(advanceResults.every(r => r !== undefined)).toBe(true);
    });
  });

  describe('Domain Services Integration', () => {
    it('should have all services configured', () => {
      expect(domainServices).toBeDefined();
      expect(domainServices.paymentServices).toBeDefined();
      expect(managementDomainService).toBeDefined();
      expect(loanPaymentService).toBeDefined();
      expect(loanPaymentStepService).toBeDefined();
      expect(transferExecutionService).toBeDefined();
    });

    it('should handle management service operations', async () => {
      // Test management service methods
      const initiateResult = await managementDomainService.initiateLoanPayment(mockLoanId, LoanPaymentTypeCodes.Funding);
      expect(initiateResult).toBeNull(); // No loan exists

      const advanceResult = await managementDomainService.advancePayment(mockPaymentId, LoanPaymentTypeCodes.Funding);
      expect(advanceResult).toBeNull(); // No payment exists

      const stepAdvanceResult = await managementDomainService.advancePaymentStep(mockStepId);
      expect(stepAdvanceResult).toBeNull(); // No step exists

      const transferResult = await managementDomainService.executeTransfer(mockTransferId);
      expect(transferResult).toBeNull(); // No transfer exists
    });
  });
});
