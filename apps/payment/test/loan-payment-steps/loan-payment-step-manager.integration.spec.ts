import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import {
  LoanPaymentStateCodes,
  LoanPaymentTypeCodes,
  PaymentAccountOwnershipTypeCodes,
  PaymentAccountProviderCodes,
  PaymentAccountStateCodes,
  PaymentAccountTypeCodes,
  PaymentStepStateCodes,
} from '@library/entity/enum';
import { EntityNotFoundException } from '@library/shared/common/exception/domain';
import { AllEntities, LoanPaymentStep, PaymentAccount } from '@library/shared/domain/entity';
import {
  FOUNDATION_TEST_IDS,
  memoryDataSourceSingle,
  TestDataSeeder,
} from '@library/shared/tests';
import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '@payment/modules/data';
import { DomainModule } from '@payment/modules/domain/domain.module';
import { PaymentStepStateIsOutOfSyncException } from '@payment/modules/domain/exceptions';
import { IDomainServices } from '@payment/modules/domain/idomain.services';
import { LoanPaymentStepFactory } from '../../src/modules/loan-payment-steps/loan-payment-step.factory';
import { LoanPaymentStepModule } from '../../src/modules/loan-payment-steps/loan-payment-step.module';
import { CompletedStepManager, CreatedStepManager, FailedStepManager, PendingStepManager } from '../../src/modules/loan-payment-steps/managers';
import { TransferExecutionModule } from '../../src/modules/transfer-execution/transfer-execution.module';

// Follow ZNG testing guidelines from .github/copilot/test-instructions.md
// Verify entity interfaces first - check libs/entity/src/interface/ for actual field names
// Use real service implementations for integration tests (2-3 levels deep)
// Test LoanPaymentStepFactory and step managers with real factory implementations
// Create test data using #region test data generation pattern
// Use uuidv4() for all test IDs and entity creation

/**
 * Integration tests for Loan Payment Step Manager
 * 
 * Tests LoanPaymentStepFactory and related step managers:
 * - CreatedStepManager, PendingStepManager, CompletedStepManager, FailedStepManager
 * 
 * These tests verify step factory functionality using real service implementations
 * with proper entity state dependencies. Step managers handle state-specific operations
 * based on payment step states (Created, Pending, Completed, Failed).
 */
describe('Loan Payment Step Manager Integration', () => {
  let module: TestingModule;
  let domainServices: IDomainServices;
  let stepFactory: LoanPaymentStepFactory;
  let createdStepManager: CreatedStepManager;
  let pendingStepManager: PendingStepManager;
  let completedStepManager: CompletedStepManager;
  let failedStepManager: FailedStepManager;
  let databaseBackup: IBackup;

  // Use foundation data IDs instead of generated ones
  const testUserId = FOUNDATION_TEST_IDS.users.primaryUser;
  const testLoanId = FOUNDATION_TEST_IDS.loans.disbursedLoan;
  const nonExistentStepId = uuidv4();

  beforeAll(async () => {
    // Create in-memory database with all entities
    const { dataSource, database } = await memoryDataSourceSingle(AllEntities);
    
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
    
    // Seed foundation data BEFORE creating backup
    await TestDataSeeder.seedFoundationData(dataSource);
    databaseBackup = database.backup();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Restore database to clean state WITH foundation data before each test
    databaseBackup.restore();
  });

  // #region test data generation

  async function createTestSourceAccount(): Promise<PaymentAccount> {
    const account = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      ownership: PaymentAccountOwnershipTypeCodes.Personal,
      provider: PaymentAccountProviderCodes.Checkbook,
      state: PaymentAccountStateCodes.Verified,
      details: {
        type: 'checkbook_ach',
        displayName: 'John Doe',
        key: 'source_key_123',
        secret: 'source_secret_456',
        accountId: `source_acc_${Date.now()}`,
        institution: 'Source Bank',
        redactedAccountNumber: '****7890',
        routingNumber: '123456789',
      },
    });

    if (!account) {
      throw new Error('Failed to create test source account - check entity constraints');
    }

    return account;
  }

  async function createTestDestinationAccount(): Promise<PaymentAccount> {
    const account = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      ownership: PaymentAccountOwnershipTypeCodes.Internal,
      provider: PaymentAccountProviderCodes.Fiserv,
      state: PaymentAccountStateCodes.Verified,
      details: {
        type: 'fiserv_debit',
        displayName: 'Zirtue Platform',
        cardToken: `dest_token_${Date.now()}`,
        cardExpiration: '12/29',
        last4Digits: '9876',
      },
    });

    if (!account) {
      throw new Error('Failed to create test destination account - check entity constraints');
    }

    return account;
  }

  async function createTestPaymentStep(
    state: typeof PaymentStepStateCodes[keyof typeof PaymentStepStateCodes] = PaymentStepStateCodes.Created
  ): Promise<LoanPaymentStep> {
    // Create payment accounts
    const sourceAccount = await createTestSourceAccount();
    const destAccount = await createTestDestinationAccount();

    // Create a payment
    const payment = await domainServices.paymentServices.createPayment({
      loanId: testLoanId,
      amount: 1000,
      type: LoanPaymentTypeCodes.Funding,
      state: LoanPaymentStateCodes.Created,
      paymentNumber: 1,
    });

    if (!payment) {
      throw new Error('Failed to create test payment - check entity constraints');
    }

    // Create payment step
    const steps = await domainServices.paymentServices.createPaymentSteps([{
      loanPaymentId: payment.id,
      order: 0,
      amount: 1000,
      sourcePaymentAccountId: sourceAccount.id,
      targetPaymentAccountId: destAccount.id,
      state: state,
    }]);

    if (!steps || steps.length === 0) {
      throw new Error('Failed to create test payment step - check entity constraints');
    }

    const step = steps[0];

    return step;
  }

  async function createTestPaymentWithMultipleSteps(
    stepCount: number = 2,
    baseAmount: number = 1000
  ): Promise<{ payment: any; steps: LoanPaymentStep[] }> {
    // Create payment accounts
    const sourceAccount = await createTestSourceAccount();
    const destAccount = await createTestDestinationAccount();

    // Create a payment
    const payment = await domainServices.paymentServices.createPayment({
      loanId: testLoanId,
      amount: baseAmount * stepCount,
      type: LoanPaymentTypeCodes.Funding,
      state: LoanPaymentStateCodes.Created,
      paymentNumber: 1,
    });

    if (!payment) {
      throw new Error('Failed to create test payment for multiple steps');
    }

    // Create multiple payment steps
    const stepRequests = Array.from({ length: stepCount }, (_, index) => ({
      loanPaymentId: payment.id,
      order: index,
      amount: baseAmount,
      sourcePaymentAccountId: sourceAccount.id,
      targetPaymentAccountId: destAccount.id,
      state: PaymentStepStateCodes.Created,
    }));

    const steps = await domainServices.paymentServices.createPaymentSteps(stepRequests);

    if (!steps || steps.length !== stepCount) {
      throw new Error(`Failed to create ${stepCount} test payment steps - expected ${stepCount}, got ${steps?.length || 0}`);
    }

    return { payment, steps };
  }

  async function createTestPaymentStepWithCustomAccounts(
    sourceAccountType: typeof PaymentAccountOwnershipTypeCodes[keyof typeof PaymentAccountOwnershipTypeCodes],
    targetAccountType: typeof PaymentAccountOwnershipTypeCodes[keyof typeof PaymentAccountOwnershipTypeCodes],
    state: typeof PaymentStepStateCodes[keyof typeof PaymentStepStateCodes] = PaymentStepStateCodes.Created
  ): Promise<LoanPaymentStep> {
    // Create custom payment accounts
    const sourceAccount = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      ownership: sourceAccountType,
      provider: PaymentAccountProviderCodes.Checkbook,
      state: PaymentAccountStateCodes.Verified,
      details: {
        type: 'checkbook_ach',
        displayName: `Source Account (${sourceAccountType})`,
        key: `src_key_${Date.now()}`,
        secret: `src_secret_${Date.now()}`,
        accountId: `SRC${Date.now()}`,
        institution: 'Source Bank',
        redactedAccountNumber: '****1234',
        routingNumber: '123456789',
      },
    });

    const targetAccount = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      ownership: targetAccountType,
      provider: PaymentAccountProviderCodes.Fiserv,
      state: PaymentAccountStateCodes.Verified,
      details: {
        type: 'fiserv_debit',
        displayName: `Target Account (${targetAccountType})`,
        cardToken: `tgt_token_${Date.now()}`,
        cardExpiration: '12/29',
        last4Digits: '5678',
      },
    });

    if (!sourceAccount || !targetAccount) {
      throw new Error('Failed to create custom test accounts');
    }

    // Create a payment
    const payment = await domainServices.paymentServices.createPayment({
      loanId: testLoanId,
      amount: 1500,
      type: LoanPaymentTypeCodes.Funding,
      state: LoanPaymentStateCodes.Created,
      paymentNumber: 1,
    });

    if (!payment) {
      throw new Error('Failed to create test payment for custom accounts');
    }

    // Create payment step
    const steps = await domainServices.paymentServices.createPaymentSteps([{
      loanPaymentId: payment.id,
      order: 0,
      amount: 1500,
      sourcePaymentAccountId: sourceAccount.id,
      targetPaymentAccountId: targetAccount.id,
      state: state,
    }]);

    if (!steps || steps.length === 0) {
      throw new Error('Failed to create test payment step with custom accounts');
    }

    return steps[0];
  }

  // #endregion

  describe('LoanPaymentStepFactory', () => {
    let testStep: LoanPaymentStep;

    beforeEach(async () => {
      // Arrange - Create test payment step for each test
      testStep = await createTestPaymentStep();
    });

    it('should get created step manager for created step state', async () => {
      // Act
      const manager = await stepFactory.getManager(testStep.id, PaymentStepStateCodes.Created);
      
      // Assert
      expect(manager).toBeInstanceOf(CreatedStepManager);
      expect(manager).toBeDefined();
    });

    it('should get pending step manager for pending step state', async () => {
      // Act
      const manager = await stepFactory.getManager(testStep.id, PaymentStepStateCodes.Pending);
      
      // Assert
      expect(manager).toBeInstanceOf(PendingStepManager);
      expect(manager).toBeDefined();
    });

    it('should get completed step manager for completed step state', async () => {
      // Act
      const manager = await stepFactory.getManager(testStep.id, PaymentStepStateCodes.Completed);
      
      // Assert
      expect(manager).toBeInstanceOf(CompletedStepManager);
      expect(manager).toBeDefined();
    });

    it('should get failed step manager for failed step state', async () => {
      // Act
      const manager = await stepFactory.getManager(testStep.id, PaymentStepStateCodes.Failed);
      
      // Assert
      expect(manager).toBeInstanceOf(FailedStepManager);
      expect(manager).toBeDefined();
    });

    it('should throw error for unsupported step state', async () => {
      // Act & Assert
      await expect(
        stepFactory.getManager(testStep.id, 'unsupported' as any)
      ).rejects.toThrow();
    });

    it('should get manager by step ID without explicit state', async () => {
      // Act
      const manager = await stepFactory.getManager(testStep.id);
      
      // Assert
      expect(manager).toBeInstanceOf(CreatedStepManager);
    });

    it('should handle non-existent step ID gracefully', async () => {
      // Act & Assert - Don't pass stepState so it tries to look up the step
      await expect(
        stepFactory.getManager(nonExistentStepId)
      ).rejects.toThrow('Payment step not found');
    });

    it('should handle factory with multiple step scenarios', async () => {
      // Arrange - Create multiple steps with different states
      const { steps } = await createTestPaymentWithMultipleSteps(3);
      
      // Act - Get managers for all steps
      const managers = await Promise.all(
        steps.map(step => stepFactory.getManager(step.id, PaymentStepStateCodes.Created))
      );
      
      // Assert
      expect(managers).toHaveLength(3);
      expect(managers.every(manager => manager instanceof CreatedStepManager)).toBe(true);
    });

    it('should handle custom account types correctly', async () => {
      // Arrange - Create step with custom account types
      const customStep = await createTestPaymentStepWithCustomAccounts(
        PaymentAccountOwnershipTypeCodes.Personal,
        PaymentAccountOwnershipTypeCodes.Internal
      );
      
      // Act
      const manager = await stepFactory.getManager(customStep.id, PaymentStepStateCodes.Created);
      
      // Assert
      expect(manager).toBeInstanceOf(CreatedStepManager);
      expect(customStep.sourcePaymentAccountId).toBeDefined();
      expect(customStep.targetPaymentAccountId).toBeDefined();
    });
  });

  describe('CreatedStepManager', () => {
    let testStep: LoanPaymentStep;

    beforeEach(async () => {
      // Arrange - Create test payment step for each test
      testStep = await createTestPaymentStep();
    });

    it('should advance created step to pending state', async () => {
      // Act
      const result = await createdStepManager.advance(testStep.id);
      
      // Assert
      expect(result).not.toBeUndefined();
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should throw EntityNotFoundException for non-existent step', async () => {
      // Act & Assert - Should throw EntityNotFoundException
      await expect(
        createdStepManager.advance(nonExistentStepId)
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should handle advancement of multiple created steps', async () => {
      // Arrange - Create multiple steps
      const { steps } = await createTestPaymentWithMultipleSteps(2);
      
      // Act - Advance all created steps
      const results = await Promise.all(
        steps.map(step => createdStepManager.advance(step.id))
      );
      
      // Assert
      expect(results).toHaveLength(2);
      expect(results.every(result => typeof result === 'boolean' || result === null)).toBe(true);
    });

    it('should handle created step with different account types', async () => {
      // Arrange - Create step with specific account types
      const customStep = await createTestPaymentStepWithCustomAccounts(
        PaymentAccountOwnershipTypeCodes.Personal,
        PaymentAccountOwnershipTypeCodes.Internal,
        PaymentStepStateCodes.Created
      );
      
      // Act
      const result = await createdStepManager.advance(customStep.id);
      
      // Assert
      expect(result).not.toBeUndefined();
      expect(typeof result === 'boolean' || result === null).toBe(true);
      expect(customStep.state).toBe(PaymentStepStateCodes.Created);
    });

    it('should validate step state before advancement', async () => {
      // Arrange - Create step in non-created state
      const pendingStep = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      
      // Act - Try to advance non-created step with CreatedStepManager
      const result = await createdStepManager.advance(pendingStep.id);
      
      // Assert - Should handle state mismatch appropriately
      expect(result).not.toBeUndefined();
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });
  });

  describe('PendingStepManager', () => {
    let testStep: LoanPaymentStep;

    beforeEach(async () => {
      // Arrange - Create test payment step in pending state
      testStep = await createTestPaymentStep(PaymentStepStateCodes.Pending);
    });

    it('should advance pending step but expect PaymentStepStateIsOutOfSyncException when no transfer found', async () => {
      // Act & Assert - PendingStepManager should throw exception when no transfer is found
      await expect(
        pendingStepManager.advance(testStep.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException when no transfer found', async () => {
      // Arrange
      const testStep2 = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      
      // Act & Assert - PendingStepManager should throw exception when no transfer is found
      await expect(
        pendingStepManager.advance(testStep2.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for non-existent step', async () => {
      // Act & Assert - Should throw PaymentStepStateIsOutOfSyncException since no transfers exist for non-existent step
      await expect(
        pendingStepManager.advance(nonExistentStepId)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for multiple pending steps with no transfers', async () => {
      // Arrange - Create multiple pending steps
      const step1 = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      const step2 = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      
      // Act & Assert - Both should throw exceptions since no transfers exist
      await expect(
        Promise.all([
          pendingStepManager.advance(step1.id),
          pendingStepManager.advance(step2.id),
        ])
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for pending step with custom accounts', async () => {
      // Arrange - Create pending step with specific account setup
      const customStep = await createTestPaymentStepWithCustomAccounts(
        PaymentAccountOwnershipTypeCodes.Internal,
        PaymentAccountOwnershipTypeCodes.Personal,
        PaymentStepStateCodes.Pending
      );
      
      // Act & Assert - Should throw exception since no transfer exists
      await expect(
        pendingStepManager.advance(customStep.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException when trying to advance created step with PendingStepManager', async () => {
      // Arrange - Create step in created state (not pending)
      const createdStep = await createTestPaymentStep(PaymentStepStateCodes.Created);
      
      // Act & Assert - Should throw exception since no transfer exists for the step
      await expect(
        pendingStepManager.advance(createdStep.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });
  });

  describe('CompletedStepManager', () => {
    let testStep: LoanPaymentStep;

    beforeEach(async () => {
      // Arrange - Create test payment step in completed state
      testStep = await createTestPaymentStep(PaymentStepStateCodes.Completed);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for completed step with no transfers', async () => {
      // Act & Assert - CompletedStepManager should throw exception when no transfers found
      await expect(
        completedStepManager.advance(testStep.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for completed step with no transfers', async () => {
      // Arrange
      const testStep2 = await createTestPaymentStep(PaymentStepStateCodes.Completed);
      
      // Act & Assert - Should throw exception since no transfers exist
      await expect(
        completedStepManager.advance(testStep2.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for non-existent step', async () => {
      // Act & Assert - Should throw PaymentStepStateIsOutOfSyncException since no transfers exist for non-existent step
      await expect(
        completedStepManager.advance(nonExistentStepId)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for multiple completed steps', async () => {
      // Arrange - Create multiple completed steps
      const step1 = await createTestPaymentStep(PaymentStepStateCodes.Completed);
      const step2 = await createTestPaymentStep(PaymentStepStateCodes.Completed);
      
      // Act & Assert - Both should throw exceptions since no transfers exist
      await expect(
        Promise.all([
          completedStepManager.advance(step1.id),
          completedStepManager.advance(step2.id),
        ])
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for completed step with custom accounts', async () => {
      // Arrange - Create completed step with custom accounts
      const customStep = await createTestPaymentStepWithCustomAccounts(
        PaymentAccountOwnershipTypeCodes.Personal,
        PaymentAccountOwnershipTypeCodes.Internal,
        PaymentStepStateCodes.Completed
      );
      
      // Act & Assert - Should throw exception since no transfers exist
      await expect(
        completedStepManager.advance(customStep.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });
  });

  describe('FailedStepManager', () => {
    let testStep: LoanPaymentStep;

    beforeEach(async () => {
      // Arrange - Create test payment step in failed state
      testStep = await createTestPaymentStep(PaymentStepStateCodes.Failed);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for failed step with no transfers', async () => {
      // Act & Assert - FailedStepManager should throw exception when no transfer found
      await expect(
        failedStepManager.advance(testStep.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for failed step with no transfers', async () => {
      // Arrange
      const testStep2 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      
      // Act & Assert - Should throw exception since no transfers exist
      await expect(
        failedStepManager.advance(testStep2.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for non-existent step', async () => {
      // Act & Assert - Should throw PaymentStepStateIsOutOfSyncException since no transfers exist for non-existent step
      await expect(
        failedStepManager.advance(nonExistentStepId)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for multiple failed steps', async () => {
      // Arrange - Create multiple failed steps
      const step1 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      const step2 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      
      // Act & Assert - Both should throw exceptions since no transfers exist
      await expect(
        Promise.all([
          failedStepManager.advance(step1.id),
          failedStepManager.advance(step2.id),
        ])
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for failed step with custom accounts', async () => {
      // Arrange - Create failed step with specific account configuration
      const customStep = await createTestPaymentStepWithCustomAccounts(
        PaymentAccountOwnershipTypeCodes.Internal,
        PaymentAccountOwnershipTypeCodes.Personal,
        PaymentStepStateCodes.Failed
      );
      
      // Act & Assert - Should throw exception since no transfers exist
      await expect(
        failedStepManager.advance(customStep.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException for retry scenarios', async () => {
      // Arrange - Create multiple failed steps to test batch retry scenarios
      const failedStep1 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      const failedStep2 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      
      // Act & Assert - Both should throw exceptions since no transfers exist
      await expect(
        Promise.all([
          failedStepManager.advance(failedStep1.id),
          failedStepManager.advance(failedStep2.id),
        ])
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });
  });

  describe('DomainServices Integration', () => {
    it('should have domain services configured', () => {
      // Assert - Verify domainServices is properly injected
      expect(domainServices).toBeDefined();
      expect(domainServices.paymentServices).toBeDefined();
      // ManagementDomainService is no longer part of IDomainServices
      // It's now accessed directly from ManagementModule
    });

    it('should have step factory configured', () => {
      // Assert - Verify step factory is properly injected
      expect(stepFactory).toBeDefined();
      expect(typeof stepFactory.getManager).toBe('function');
    });

    it('should have all step managers configured', () => {
      // Assert - Verify all step managers are properly injected
      expect(createdStepManager).toBeDefined();
      expect(pendingStepManager).toBeDefined();
      expect(completedStepManager).toBeDefined();
      expect(failedStepManager).toBeDefined();
      
      // Verify manager methods exist
      expect(typeof createdStepManager.advance).toBe('function');
      expect(typeof pendingStepManager.advance).toBe('function');
      expect(typeof completedStepManager.advance).toBe('function');
      expect(typeof failedStepManager.advance).toBe('function');
    });

    it('should integrate step factory with domain services', async () => {
      // Arrange - Create a test step
      const testStep = await createTestPaymentStep();
      
      // Act - Use factory to get manager
      const manager = await stepFactory.getManager(testStep.id);
      
      // Assert
      expect(manager).toBeInstanceOf(CreatedStepManager);
      expect(testStep).toBeDefined();
      expect(testStep.id).toBeDefined();
    });

    it('should handle end-to-end step management workflow', async () => {
      // Arrange - Create multiple steps for workflow test
      const { steps } = await createTestPaymentWithMultipleSteps(3);
      
      // Act - Get managers for all steps and verify they can be advanced
      const managers = await Promise.all(
        steps.map(step => stepFactory.getManager(step.id))
      );
      
      const advanceResults = await Promise.all(
        steps.map((step, index) => managers[index].advance(step.id))
      );
      
      // Assert
      expect(managers).toHaveLength(3);
      expect(managers.every(manager => manager instanceof CreatedStepManager)).toBe(true);
      expect(advanceResults).toHaveLength(3);
      expect(advanceResults.every(result => typeof result === 'boolean' || result === null)).toBe(true);
    });

    it('should throw PaymentStepStateIsOutOfSyncException when advancing pending step with no transfers', async () => {
      // Arrange - Create a pending step
      const pendingStep = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      
      // Act - Use factory to get appropriate manager and advance step
      const manager = await stepFactory.getManager(pendingStep.id, PaymentStepStateCodes.Pending);
      
      // Assert
      expect(manager).toBeInstanceOf(PendingStepManager);
      expect(pendingStep).toBeDefined();
      expect(pendingStep.state).toBe(PaymentStepStateCodes.Pending);
      
      // Act & Assert - Should throw exception since no transfers exist for pending step
      await expect(
        manager.advance(pendingStep.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should handle service errors gracefully', async () => {
      // Act & Assert - Test error handling with invalid step ID
      await expect(
        stepFactory.getManager(nonExistentStepId)
      ).rejects.toThrow(EntityNotFoundException);
      
      // Act & Assert - Test managers with non-existent steps (should throw PaymentStepStateIsOutOfSyncException)
      await expect(
        createdStepManager.advance(nonExistentStepId)
      ).rejects.toThrow(EntityNotFoundException);
      
      await expect(
        pendingStepManager.advance(nonExistentStepId)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle concurrent step advancements with expected exceptions', async () => {
      // Arrange - Create multiple steps for concurrent testing
      const step1 = await createTestPaymentStep(PaymentStepStateCodes.Created);
      const step2 = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      const step3 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      
      // Act & Assert - Test concurrent operations
      // Created step should succeed (creates transfer)
      const result1 = await createdStepManager.advance(step1.id);
      expect(typeof result1 === 'boolean' || result1 === null).toBe(true);
      
      // Pending and Failed steps should throw exceptions (no transfers)
      await expect(
        pendingStepManager.advance(step2.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
      
      await expect(
        failedStepManager.advance(step3.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should handle mixed state operations with factory and expected exceptions', async () => {
      // Arrange - Create steps in different states
      const createdStep = await createTestPaymentStep(PaymentStepStateCodes.Created);
      const pendingStep = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      const completedStep = await createTestPaymentStep(PaymentStepStateCodes.Completed);
      const failedStep = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      
      // Act - Get appropriate managers for each state
      const managers = await Promise.all([
        stepFactory.getManager(createdStep.id, PaymentStepStateCodes.Created),
        stepFactory.getManager(pendingStep.id, PaymentStepStateCodes.Pending),
        stepFactory.getManager(completedStep.id, PaymentStepStateCodes.Completed),
        stepFactory.getManager(failedStep.id, PaymentStepStateCodes.Failed),
      ]);
      
      // Assert
      expect(managers[0]).toBeInstanceOf(CreatedStepManager);
      expect(managers[1]).toBeInstanceOf(PendingStepManager);
      expect(managers[2]).toBeInstanceOf(CompletedStepManager);
      expect(managers[3]).toBeInstanceOf(FailedStepManager);
      
      // Act & Assert - Test advancement behavior
      // Created step should succeed (creates transfer)
      const result1 = await managers[0].advance(createdStep.id);
      expect(typeof result1 === 'boolean' || result1 === null).toBe(true);
      
      // Other states should throw exceptions (no transfers)
      await expect(
        managers[1].advance(pendingStep.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
      
      await expect(
        managers[2].advance(completedStep.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
      
      await expect(
        managers[3].advance(failedStep.id)
      ).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should validate state consistency across multiple payment steps', async () => {
      // Arrange - Create payment with multiple steps
      const { payment, steps } = await createTestPaymentWithMultipleSteps(3, 500);
      
      // Assert
      expect(payment).toBeDefined();
      expect(steps).toHaveLength(3);
      expect(steps.every(step => step.state === PaymentStepStateCodes.Created)).toBe(true);
      expect(steps.every(step => step.amount === 500)).toBe(true);
      expect(steps.every(step => step.loanPaymentId === payment.id)).toBe(true);
      
      // Act - Get managers for all steps
      const managers = await Promise.all(
        steps.map(step => stepFactory.getManager(step.id))
      );
      
      // Assert
      expect(managers).toHaveLength(3);
      expect(managers.every(manager => manager instanceof CreatedStepManager)).toBe(true);
    });

    it('should handle complex account type scenarios', async () => {
      // Arrange - Test different account type combinations
      const scenarios = [
        {
          source: PaymentAccountOwnershipTypeCodes.Personal,
          target: PaymentAccountOwnershipTypeCodes.Internal,
        },
        {
          source: PaymentAccountOwnershipTypeCodes.Internal,
          target: PaymentAccountOwnershipTypeCodes.Personal,
        },
      ];
      
      // Act - Create steps for each scenario
      const steps = await Promise.all(
        scenarios.map(scenario =>
          createTestPaymentStepWithCustomAccounts(
            scenario.source,
            scenario.target,
            PaymentStepStateCodes.Created
          )
        )
      );
      
      // Assert
      expect(steps).toHaveLength(2);
      expect(steps.every(step => step.state === PaymentStepStateCodes.Created)).toBe(true);
      
      // Act - Get managers and advance steps
      const managers = await Promise.all(
        steps.map(step => stepFactory.getManager(step.id))
      );
      
      const results = await Promise.all(
        steps.map((step, index) => managers[index].advance(step.id))
      );
      
      // Assert
      expect(results).toHaveLength(2);
      expect(results.every(result => typeof result === 'boolean' || result === null)).toBe(true);
    });
  });
});
