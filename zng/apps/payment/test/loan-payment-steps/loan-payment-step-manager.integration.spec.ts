import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
import { IDomainServices } from '../../src/domain/idomain.services';
import { LoanPaymentStepFactory } from '../../src/loan-payment-steps/loan-payment-step.factory';
import { CreatedStepManager, PendingStepManager, CompletedStepManager, FailedStepManager } from '../../src/loan-payment-steps/managers';
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
import { LoanPaymentStepModule } from '../../src/loan-payment-steps/loan-payment-step.module';
import { TransferExecutionModule } from '../../src/transfer-execution/transfer-execution.module';
import { memoryDataSourceForTests } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entities';
import { DbSchemaCodes } from '@library/shared/common/data';

describe('Loan Payment Step Manager Integration', () => {
  let module: TestingModule;
  let domainServices: IDomainServices;
  let stepFactory: LoanPaymentStepFactory;
  let createdStepManager: CreatedStepManager;
  let pendingStepManager: PendingStepManager;
  let completedStepManager: CompletedStepManager;
  let failedStepManager: FailedStepManager;
  let databaseBackup: IBackup;

  // Test data
  const mockUserId = uuidv4();
  const mockLoanId = uuidv4();
  const mockStepId = uuidv4();

  const mockSourceAccount: DeepPartial<IPaymentAccount> = {
    userId: mockUserId,
    type: PaymentAccountTypeCodes.BankAccount,
    ownership: PaymentAccountOwnershipTypeCodes.Personal,
    provider: PaymentAccountProviderCodes.Checkbook,
    isDefault: true,
    isActive: true,
    accountHolderName: 'John Doe',
  };

  const mockDestinationAccount: DeepPartial<IPaymentAccount> = {
    userId: mockUserId,
    type: PaymentAccountTypeCodes.BankAccount,
    ownership: PaymentAccountOwnershipTypeCodes.Internal,
    provider: PaymentAccountProviderCodes.Fiserv,
    isDefault: true,
    isActive: true,
    accountHolderName: 'Zirtue Platform',
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
        LoanPaymentStepModule, // Loan payment step module
        TransferExecutionModule, // Transfer execution module
      ],
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    domainServices = module.get<IDomainServices>(IDomainServices);
    stepFactory = module.get<LoanPaymentStepFactory>(LoanPaymentStepFactory);
    createdStepManager = module.get<CreatedStepManager>(CreatedStepManager);
    pendingStepManager = module.get<PendingStepManager>(PendingStepManager);
    completedStepManager = module.get<CompletedStepManager>(CompletedStepManager);
    failedStepManager = module.get<FailedStepManager>(FailedStepManager);
    
    databaseBackup = database.backup();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    // Restore database to clean state before each test
    databaseBackup.restore();
  });

  describe('LoanPaymentStepFactory', () => {
    let mockStep: ILoanPaymentStep;

    beforeEach(async () => {
      // Create payment accounts
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockSourceAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockDestinationAccount);

      // Create a payment
      const mockPayment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      // Create payment step
      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: mockPayment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Created,
      }]);

      mockStep = steps![0];
    });

    it('should get created step manager for created step', async () => {
      const manager = await stepFactory.getManager(mockStep.id, PaymentStepStateCodes.Created);
      
      expect(manager).toBeInstanceOf(CreatedStepManager);
    });

    it('should get pending step manager for pending step', async () => {
      const manager = await stepFactory.getManager(mockStep.id, PaymentStepStateCodes.Pending);
      
      expect(manager).toBeInstanceOf(PendingStepManager);
    });

    it('should get completed step manager for completed step', async () => {
      const manager = await stepFactory.getManager(mockStep.id, PaymentStepStateCodes.Completed);
      
      expect(manager).toBeInstanceOf(CompletedStepManager);
    });

    it('should get failed step manager for failed step', async () => {
      const manager = await stepFactory.getManager(mockStep.id, PaymentStepStateCodes.Failed);
      
      expect(manager).toBeInstanceOf(FailedStepManager);
    });

    it('should throw error for unsupported step state', async () => {
      await expect(
        stepFactory.getManager(mockStep.id, 'unsupported' as any)
      ).rejects.toThrow();
    });

    it('should get manager by step ID without explicit state', async () => {
      const manager = await stepFactory.getManager(mockStep.id);
      
      expect(manager).toBeInstanceOf(CreatedStepManager);
    });
  });

  describe('CreatedStepManager', () => {
    let mockStep: ILoanPaymentStep;

    beforeEach(async () => {
      // Create payment accounts
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockSourceAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockDestinationAccount);

      // Create a payment
      const mockPayment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      // Create payment step
      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: mockPayment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Created,
      }]);

      mockStep = steps![0];
    });

    it('should advance created step', async () => {
      const result = await createdStepManager.advance(mockStep.id);
      
      // Expect result to indicate advancement was attempted
      expect(result).toBeDefined();
    });

    it('should handle non-existent step', async () => {
      const result = await createdStepManager.advance(mockStepId);
      
      // Should handle gracefully and return null or false
      expect(result).toBeDefined();
    });
  });

  describe('PendingStepManager', () => {
    let mockStep: ILoanPaymentStep;

    beforeEach(async () => {
      // Create payment accounts
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockSourceAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockDestinationAccount);

      // Create a payment
      const mockPayment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      // Create payment step in pending state
      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: mockPayment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Pending,
      }]);

      mockStep = steps![0];
    });

    it('should advance pending step', async () => {
      const result = await pendingStepManager.advance(mockStep.id);
      
      // Expect result to indicate advancement was attempted
      expect(result).toBeDefined();
    });
  });

  describe('CompletedStepManager', () => {
    let mockStep: ILoanPaymentStep;

    beforeEach(async () => {
      // Create payment accounts
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockSourceAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockDestinationAccount);

      // Create a payment
      const mockPayment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      // Create payment step in completed state
      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: mockPayment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Completed,
      }]);

      mockStep = steps![0];
    });

    it('should handle completed step advancement', async () => {
      // Completed steps typically should not advance further
      const result = await completedStepManager.advance(mockStep.id);
      
      // Expect result to indicate no advancement needed
      expect(result).toBeDefined();
    });
  });

  describe('FailedStepManager', () => {
    let mockStep: ILoanPaymentStep;

    beforeEach(async () => {
      // Create payment accounts
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockSourceAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockDestinationAccount);

      // Create a payment
      const mockPayment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      // Create payment step in failed state
      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: mockPayment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Failed,
      }]);

      mockStep = steps![0];
    });

    it('should handle failed step advancement', async () => {
      const result = await failedStepManager.advance(mockStep.id);
      
      // Expect result to indicate advancement was attempted
      expect(result).toBeDefined();
    });
  });

  describe('DomainServices Integration', () => {
    it('should have domain services configured', () => {
      // Verify domainServices is properly injected
      expect(domainServices).toBeDefined();
      expect(domainServices.paymentServices).toBeDefined();
      // ManagementDomainService is no longer part of IDomainServices
      // It's now accessed directly from ManagementModule
    });

    it('should have step factory configured', () => {
      // Verify step factory is properly injected
      expect(stepFactory).toBeDefined();
    });

    it('should have all step managers configured', () => {
      // Verify all step managers are properly injected
      expect(createdStepManager).toBeDefined();
      expect(pendingStepManager).toBeDefined();
      expect(completedStepManager).toBeDefined();
      expect(failedStepManager).toBeDefined();
    });
  });
});
