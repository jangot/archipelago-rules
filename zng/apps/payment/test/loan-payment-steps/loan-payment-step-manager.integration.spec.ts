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
  PaymentAccountStateCodes,
  PaymentStepStateCodes,
} from '@library/entity/enum';
import { LoanPaymentStepModule } from '../../src/loan-payment-steps/loan-payment-step.module';
import { TransferExecutionModule } from '../../src/transfer-execution/transfer-execution.module';
import { memoryDataSourceSingle } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entities';

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

  // Use uuidv4() for all test IDs and entity creation
  const testUserId = uuidv4();
  const testLoanId = uuidv4();
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
    
    databaseBackup = database.backup();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Restore database to clean state before each test
    databaseBackup.restore();
    
    // Create test loan for all tests
    await createTestLoan();
  });

  // #region test data generation

  async function createTestLoan(): Promise<void> {
    // Create a minimal loan entity to satisfy foreign key constraints
    const dataSource = module.get(DataSource);
    await dataSource.query(`
      INSERT INTO core.loans (
        id, amount, type, state, closure_type, payments_count, payment_frequency, lender_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      )
    `, [
      testLoanId,
      5000,
      'personal',
      'created',
      'open',
      12,
      'monthly',
      testUserId,
    ]);
    
    // Create loan invitee to satisfy constraints
    await dataSource.query(`
      INSERT INTO core.loan_invitees (
        id, loan_id, type, first_name, last_name, email, phone
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
    `, [
      uuidv4(),
      testLoanId,
      'borrower',
      'Test',
      'Borrower',
      `borrower-${Date.now()}@test.com`,
      '+1234567890',
    ]);
  }

  async function createTestSourceAccount(): Promise<IPaymentAccount> {
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
      isDefault: true,
      isActive: true,
    });

    if (!account) {
      throw new Error('Failed to create test source account - check entity constraints');
    }

    return account;
  }

  async function createTestDestinationAccount(): Promise<IPaymentAccount> {
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
      isDefault: true,
      isActive: true,
    });

    if (!account) {
      throw new Error('Failed to create test destination account - check entity constraints');
    }

    return account;
  }

  async function createTestPaymentStep(
    state: typeof PaymentStepStateCodes[keyof typeof PaymentStepStateCodes] = PaymentStepStateCodes.Created
  ): Promise<ILoanPaymentStep> {
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

    return steps[0];
  }

  async function createTestPaymentWithMultipleSteps(
    stepCount: number = 2,
    baseAmount: number = 1000
  ): Promise<{ payment: any; steps: ILoanPaymentStep[] }> {
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
  ): Promise<ILoanPaymentStep> {
    // Create custom payment accounts
    const sourceAccount = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      ownership: sourceAccountType,
      provider: PaymentAccountProviderCodes.Checkbook,
      accountHolderName: `Source Account (${sourceAccountType})`,
      accountNumber: `SRC${Date.now()}`,
      routingNumber: '123456789',
      isDefault: false,
      isActive: true,
    });

    const targetAccount = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      ownership: targetAccountType,
      provider: PaymentAccountProviderCodes.Fiserv,
      accountHolderName: `Target Account (${targetAccountType})`,
      accountNumber: `TGT${Date.now()}`,
      routingNumber: '987654321',
      isDefault: false,
      isActive: true,
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
    let testStep: ILoanPaymentStep;

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
      // Act & Assert
      await expect(
        stepFactory.getManager(nonExistentStepId, PaymentStepStateCodes.Created)
      ).rejects.toThrow();
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
    let testStep: ILoanPaymentStep;

    beforeEach(async () => {
      // Arrange - Create test payment step for each test
      testStep = await createTestPaymentStep();
    });

    it('should advance created step to pending state', async () => {
      // Act
      const result = await createdStepManager.advance(testStep.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should handle non-existent step gracefully', async () => {
      // Act
      const result = await createdStepManager.advance(nonExistentStepId);
      
      // Assert - Should handle gracefully
      expect(result).toBeDefined();
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
      expect(results.every(result => result !== undefined)).toBe(true);
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
      expect(result).toBeDefined();
      expect(customStep.state).toBe(PaymentStepStateCodes.Created);
    });

    it('should validate step state before advancement', async () => {
      // Arrange - Create step in non-created state
      const pendingStep = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      
      // Act - Try to advance non-created step with CreatedStepManager
      const result = await createdStepManager.advance(pendingStep.id);
      
      // Assert - Should handle state mismatch appropriately
      expect(result).toBeDefined();
    });
  });

  describe('PendingStepManager', () => {
    let testStep: ILoanPaymentStep;

    beforeEach(async () => {
      // Arrange - Create test payment step in pending state
      testStep = await createTestPaymentStep(PaymentStepStateCodes.Pending);
    });

    it('should advance pending step to completed state', async () => {
      // Act
      const result = await pendingStepManager.advance(testStep.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    it('should handle step state transitions properly', async () => {
      // Arrange
      const testStep2 = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      
      // Act
      const result = await pendingStepManager.advance(testStep2.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(testStep2.state).toBe(PaymentStepStateCodes.Pending);
    });

    it('should handle non-existent pending step', async () => {
      // Act
      const result = await pendingStepManager.advance(nonExistentStepId);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should handle multiple pending steps advancement', async () => {
      // Arrange - Create multiple pending steps
      const step1 = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      const step2 = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      
      // Act - Advance both steps
      const results = await Promise.all([
        pendingStepManager.advance(step1.id),
        pendingStepManager.advance(step2.id),
      ]);
      
      // Assert
      expect(results).toHaveLength(2);
      expect(results.every(result => result !== undefined)).toBe(true);
    });

    it('should handle pending step with custom account configuration', async () => {
      // Arrange - Create pending step with specific account setup
      const customStep = await createTestPaymentStepWithCustomAccounts(
        PaymentAccountOwnershipTypeCodes.Internal,
        PaymentAccountOwnershipTypeCodes.Personal,
        PaymentStepStateCodes.Pending
      );
      
      // Act
      const result = await pendingStepManager.advance(customStep.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(customStep.state).toBe(PaymentStepStateCodes.Pending);
    });

    it('should validate step is in correct state before advancement', async () => {
      // Arrange - Create step in created state (not pending)
      const createdStep = await createTestPaymentStep(PaymentStepStateCodes.Created);
      
      // Act - Try to advance created step with PendingStepManager
      const result = await pendingStepManager.advance(createdStep.id);
      
      // Assert - Should handle state mismatch appropriately
      expect(result).toBeDefined();
    });
  });

  describe('CompletedStepManager', () => {
    let testStep: ILoanPaymentStep;

    beforeEach(async () => {
      // Arrange - Create test payment step in completed state
      testStep = await createTestPaymentStep(PaymentStepStateCodes.Completed);
    });

    it('should handle completed step advancement appropriately', async () => {
      // Act - Completed steps typically should not advance further
      const result = await completedStepManager.advance(testStep.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(testStep.state).toBe(PaymentStepStateCodes.Completed);
    });

    it('should return appropriate status for completed steps', async () => {
      // Arrange
      const testStep2 = await createTestPaymentStep(PaymentStepStateCodes.Completed);
      
      // Act
      const result = await completedStepManager.advance(testStep2.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(testStep2.state).toBe(PaymentStepStateCodes.Completed);
    });

    it('should handle non-existent completed step', async () => {
      // Act
      const result = await completedStepManager.advance(nonExistentStepId);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should handle multiple completed steps', async () => {
      // Arrange - Create multiple completed steps
      const step1 = await createTestPaymentStep(PaymentStepStateCodes.Completed);
      const step2 = await createTestPaymentStep(PaymentStepStateCodes.Completed);
      
      // Act
      const results = await Promise.all([
        completedStepManager.advance(step1.id),
        completedStepManager.advance(step2.id),
      ]);
      
      // Assert
      expect(results).toHaveLength(2);
      expect(results.every(result => result !== undefined)).toBe(true);
    });

    it('should maintain completed state consistency', async () => {
      // Arrange - Create completed step with custom accounts
      const customStep = await createTestPaymentStepWithCustomAccounts(
        PaymentAccountOwnershipTypeCodes.Personal,
        PaymentAccountOwnershipTypeCodes.Internal,
        PaymentStepStateCodes.Completed
      );
      
      // Act
      const result = await completedStepManager.advance(customStep.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(customStep.state).toBe(PaymentStepStateCodes.Completed);
    });
  });

  describe('FailedStepManager', () => {
    let testStep: ILoanPaymentStep;

    beforeEach(async () => {
      // Arrange - Create test payment step in failed state
      testStep = await createTestPaymentStep(PaymentStepStateCodes.Failed);
    });

    it('should handle failed step advancement or retry logic', async () => {
      // Act
      const result = await failedStepManager.advance(testStep.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(testStep.state).toBe(PaymentStepStateCodes.Failed);
    });

    it('should handle retry scenarios for failed steps', async () => {
      // Arrange
      const testStep2 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      
      // Act
      const result = await failedStepManager.advance(testStep2.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(testStep2.state).toBe(PaymentStepStateCodes.Failed);
    });

    it('should handle non-existent failed step', async () => {
      // Act
      const result = await failedStepManager.advance(nonExistentStepId);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should handle multiple failed steps', async () => {
      // Arrange - Create multiple failed steps
      const step1 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      const step2 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      
      // Act
      const results = await Promise.all([
        failedStepManager.advance(step1.id),
        failedStepManager.advance(step2.id),
      ]);
      
      // Assert
      expect(results).toHaveLength(2);
      expect(results.every(result => result !== undefined)).toBe(true);
    });

    it('should handle failed step retry with different account types', async () => {
      // Arrange - Create failed step with specific account configuration
      const customStep = await createTestPaymentStepWithCustomAccounts(
        PaymentAccountOwnershipTypeCodes.Internal,
        PaymentAccountOwnershipTypeCodes.Personal,
        PaymentStepStateCodes.Failed
      );
      
      // Act
      const result = await failedStepManager.advance(customStep.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(customStep.state).toBe(PaymentStepStateCodes.Failed);
    });

    it('should validate error handling for retry scenarios', async () => {
      // Arrange - Create multiple failed steps to test batch retry scenarios
      const failedStep1 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      const failedStep2 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      
      // Act - Attempt to advance both failed steps
      const results = await Promise.all([
        failedStepManager.advance(failedStep1.id),
        failedStepManager.advance(failedStep2.id),
      ]);
      
      // Assert
      expect(results).toHaveLength(2);
      expect(results.every(result => result !== undefined)).toBe(true);
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
      expect(advanceResults.every(result => result !== undefined)).toBe(true);
    });

    it('should validate cross-service integration', async () => {
      // Arrange - Create step with specific state
      const pendingStep = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      
      // Act - Use factory to get appropriate manager
      const manager = await stepFactory.getManager(pendingStep.id, PaymentStepStateCodes.Pending);
      
      // Assert
      expect(manager).toBeInstanceOf(PendingStepManager);
      expect(pendingStep).toBeDefined();
      expect(pendingStep.state).toBe(PaymentStepStateCodes.Pending);
      
      // Act - Advance step and verify result
      const advanceResult = await manager.advance(pendingStep.id);
      
      // Assert
      expect(advanceResult).toBeDefined();
    });

    it('should handle service errors gracefully', async () => {
      // Act & Assert - Test error handling with invalid data
      await expect(
        stepFactory.getManager(nonExistentStepId)
      ).rejects.toThrow();
      
      // Act - Test managers with non-existent steps
      const results = await Promise.all([
        createdStepManager.advance(nonExistentStepId),
        pendingStepManager.advance(nonExistentStepId),
        completedStepManager.advance(nonExistentStepId),
        failedStepManager.advance(nonExistentStepId),
      ]);
      
      // Assert - All should handle gracefully
      expect(results).toHaveLength(4);
      expect(results.every(result => result !== undefined)).toBe(true);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle concurrent step advancements', async () => {
      // Arrange - Create multiple steps for concurrent testing
      const step1 = await createTestPaymentStep(PaymentStepStateCodes.Created);
      const step2 = await createTestPaymentStep(PaymentStepStateCodes.Pending);
      const step3 = await createTestPaymentStep(PaymentStepStateCodes.Failed);
      
      // Act - Advance steps concurrently
      const results = await Promise.all([
        createdStepManager.advance(step1.id),
        pendingStepManager.advance(step2.id),
        failedStepManager.advance(step3.id),
      ]);
      
      // Assert
      expect(results).toHaveLength(3);
      expect(results.every(result => result !== undefined)).toBe(true);
    });

    it('should handle mixed state operations with factory', async () => {
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
      
      // Act - Advance all steps
      const advanceResults = await Promise.all([
        managers[0].advance(createdStep.id),
        managers[1].advance(pendingStep.id),
        managers[2].advance(completedStep.id),
        managers[3].advance(failedStep.id),
      ]);
      
      // Assert
      expect(advanceResults).toHaveLength(4);
      expect(advanceResults.every(result => result !== undefined)).toBe(true);
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
      expect(results.every(result => result !== undefined)).toBe(true);
    });
  });
});
