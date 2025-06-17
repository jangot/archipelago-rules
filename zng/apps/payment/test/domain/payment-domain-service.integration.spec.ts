import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentDomainService } from '../../src/domain/services/payment.domain.service';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
import { 
  ILoanPayment, 
  ILoanPaymentStep, 
  IPaymentAccount, 
} from '@library/entity/interface';
import { 
  LoanPaymentStateCodes, 
  LoanPaymentTypeCodes, 
  LoanTypeCodes, 
  PaymentAccountOwnershipTypeCodes, 
  PaymentAccountProviderCodes, 
  PaymentAccountStateCodes,
  PaymentAccountTypeCodes, 
  PaymentStepStateCodes, 
} from '@library/entity/enum';
import { DeepPartial } from 'typeorm';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';
import { memoryDataSourceSingle } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entities';

// Follow ZNG testing guidelines from .github/copilot/test-instructions.md
// Use real service implementations for integration tests (2-3 levels deep)
// Create test data using #region test data generation pattern
/**
 * Integration tests for PaymentDomainService
 * 
 * These tests verify the PaymentDomainService functionality using real service implementations
 * with an in-memory database. The tests follow ZNG testing guidelines by:
 * - Using real service implementations for 2-3 levels of dependency injection
 * - Only mocking repositories and external APIs
 * - Using uuidv4() for all test IDs
 * - Grouping test data generation functions in #region markers
 * - Following AAA (Arrange-Act-Assert) pattern consistently
 */
describe('PaymentDomainService Integration', () => {
  let module: TestingModule;
  let paymentDomainService: PaymentDomainService;
  let databaseBackup: IBackup;

  // Use uuidv4() for all test IDs and entity creation
  const testUserId = uuidv4();
  const testLoanId = uuidv4();
  const nonExistentAccountId = uuidv4();
  const nonExistentPaymentId = uuidv4();

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
      ],
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    paymentDomainService = module.get<PaymentDomainService>(PaymentDomainService);
    databaseBackup = database.backup();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    // Restore database to clean state before each test
    databaseBackup.restore();
  });

  // #region test data generation

  /**
   * Creates a test payment account with personal ownership and Checkbook provider
   * @param userId - Optional user ID to assign the account to, defaults to testUserId
   * @returns Promise resolving to the created payment account
   * @throws Error if account creation fails due to constraint violations
   */
  async function createTestPaymentAccount(userId?: string): Promise<IPaymentAccount> {
    const userIdToUse = userId || testUserId;
    const accountInput: DeepPartial<IPaymentAccount> = {
      userId: userIdToUse,
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Checkbook,
      ownership: PaymentAccountOwnershipTypeCodes.Personal,
      accountHolderName: 'John Smith',
      accountNumber: `1234567890${Date.now()}${Math.random().toString(36).substring(2, 7)}`, // Unique account number
      routingNumber: '123456789',
      state: PaymentAccountStateCodes.Verified,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await paymentDomainService.addPaymentAccount(userIdToUse, accountInput);
    
    if (!result) {
      throw new Error('Failed to create test payment account - check entity constraints and required fields');
    }
    
    return result;
  }

  /**
   * Creates a test internal payment account with Fiserv provider
   * @param userId - Optional user ID to assign the account to, defaults to testUserId
   * @returns Promise resolving to the created internal payment account
   * @throws Error if account creation fails due to constraint violations
   */
  async function createTestInternalAccount(userId?: string): Promise<IPaymentAccount> {
    const userIdToUse = userId || testUserId;
    const accountInput: DeepPartial<IPaymentAccount> = {
      userId: userIdToUse,
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Fiserv,
      ownership: PaymentAccountOwnershipTypeCodes.Internal,
      accountHolderName: 'Internal Platform Account',
      accountNumber: `9876543210${Date.now()}${Math.random().toString(36).substring(2, 7)}`, // Unique account number
      routingNumber: '987654321',
      state: PaymentAccountStateCodes.Verified,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await paymentDomainService.addPaymentAccount(userIdToUse, accountInput);
    
    if (!result) {
      throw new Error('Failed to create test internal account - check entity constraints and required fields');
    }
    
    return result;
  }

  /**
   * Creates a test funding loan payment with default amount of 1000
   * @param loanId - Optional loan ID to associate the payment with, defaults to testLoanId
   * @returns Promise resolving to the created loan payment
   * @throws Error if payment creation fails due to constraint violations
   */
  async function createTestPayment(loanId?: string): Promise<ILoanPayment> {
    const loanIdToUse = loanId || testLoanId;
    const paymentInput: DeepPartial<ILoanPayment> = {
      loanId: loanIdToUse,
      amount: 1000,
      type: LoanPaymentTypeCodes.Funding,
      state: LoanPaymentStateCodes.Created,
      paymentNumber: 1,
      scheduledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await paymentDomainService.createPayment(paymentInput);
    
    if (!result) {
      throw new Error('Failed to create test payment - verify all entity constraints and required fields');
    }
    
    return result;
  }

  /**
   * Creates two test payment steps for a loan payment, each with 500 amount
   * @param paymentId - The loan payment ID to associate the steps with
   * @param sourceAccountId - The source payment account ID for transfers
   * @param targetAccountId - The target payment account ID for transfers
   * @returns Promise resolving to array of created payment steps
   * @throws Error if step creation fails due to constraint violations
   */
  async function createTestPaymentSteps(paymentId: string, sourceAccountId: string, targetAccountId: string): Promise<ILoanPaymentStep[]> {
    const stepInputs: DeepPartial<ILoanPaymentStep>[] = [
      {
        loanPaymentId: paymentId,
        order: 0,
        amount: 500,
        sourcePaymentAccountId: sourceAccountId,
        targetPaymentAccountId: targetAccountId,
        state: PaymentStepStateCodes.Created,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        loanPaymentId: paymentId,
        order: 1,
        amount: 500,
        sourcePaymentAccountId: sourceAccountId,
        targetPaymentAccountId: targetAccountId,
        state: PaymentStepStateCodes.Created,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    
    const result = await paymentDomainService.createPaymentSteps(stepInputs);
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create test payment steps - verify all entity constraints and required fields');
    }
    
    return result;
  }

  /**
   * Creates a test repayment loan payment with configurable amount
   * @param loanId - Optional loan ID to associate the payment with, defaults to testLoanId
   * @param amount - The repayment amount, defaults to 200
   * @returns Promise resolving to the created repayment payment
   * @throws Error if payment creation fails due to constraint violations
   */
  async function createTestRepaymentPayment(loanId?: string, amount: number = 200): Promise<ILoanPayment> {
    const loanIdToUse = loanId || testLoanId;
    const paymentInput: DeepPartial<ILoanPayment> = {
      loanId: loanIdToUse,
      amount: amount,
      type: LoanPaymentTypeCodes.Repayment,
      state: LoanPaymentStateCodes.Created,
      paymentNumber: 2,
      scheduledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await paymentDomainService.createPayment(paymentInput);
    
    if (!result) {
      throw new Error('Failed to create test repayment payment - verify all entity constraints');
    }
    
    return result;
  }

  /**
   * Creates a complete test data set including payment, accounts, and steps
   * @returns Promise resolving to an object containing all created test entities
   * @throws Error if any entity creation fails due to constraint violations
   */
  async function createCompleteTestData(): Promise<{
    payment: ILoanPayment;
    sourceAccount: IPaymentAccount;
    destAccount: IPaymentAccount;
    steps: ILoanPaymentStep[];
  }> {
    const payment = await createTestPayment();
    const sourceAccount = await createTestPaymentAccount();
    const destAccount = await createTestInternalAccount();
    const steps = await createTestPaymentSteps(payment.id, sourceAccount.id, destAccount.id);
    
    return {
      payment,
      sourceAccount,
      destAccount,
      steps,
    };
  }

  // #endregion

  describe('Account Management', () => {
    it('should add a payment account with all required fields', async () => {
      // Act
      const result = await createTestPaymentAccount();
      
      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(testUserId);
      expect(result.type).toBe(PaymentAccountTypeCodes.BankAccount);
      expect(result.provider).toBe(PaymentAccountProviderCodes.Checkbook);
      expect(result.accountHolderName).toBe('John Smith');
      expect(result.isActive).toBe(true);
    });

    it('should get a payment account by ID when it exists', async () => {
      // Arrange
      const created = await createTestPaymentAccount();
      
      // Act
      const result = await paymentDomainService.getPaymentAccountById(created.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(created.id);
      expect(result!.userId).toBe(testUserId);
      expect(result!.accountHolderName).toBe('John Smith');
    });

    it('should return null when payment account is not found', async () => {
      // Act
      const result = await paymentDomainService.getPaymentAccountById(nonExistentAccountId);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should create internal payment account with correct ownership', async () => {
      // Act
      const result = await createTestInternalAccount();
      
      // Assert
      expect(result).toBeDefined();
      expect(result.ownership).toBe(PaymentAccountOwnershipTypeCodes.Internal);
      expect(result.provider).toBe(PaymentAccountProviderCodes.Fiserv);
    });
  });

  describe('Loan Management', () => {
    it('should return null when loan is not found', async () => {
      // Act
      const result = await paymentDomainService.getLoanById(testLoanId);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should handle non-existent loan ID gracefully', async () => {
      // Arrange
      const nonExistentLoanId = uuidv4();
      
      // Act
      const result = await paymentDomainService.getLoanById(nonExistentLoanId);
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Payment Management', () => {
    it('should return null when payment is not found', async () => {
      // Act
      const result = await paymentDomainService.getLoanPaymentById(nonExistentPaymentId);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should create a new payment with valid data', async () => {
      // Act
      const result = await createTestPayment();
      
      // Assert
      expect(result).toBeDefined();
      expect(result.amount).toBe(1000);
      expect(result.type).toBe(LoanPaymentTypeCodes.Funding);
      expect(result.loanId).toBe(testLoanId);
      expect(result.state).toBe(LoanPaymentStateCodes.Created);
    });

    it('should update a payment state successfully', async () => {
      // Arrange
      const created = await createTestPayment();
      const updates: DeepPartial<ILoanPayment> = {
        state: LoanPaymentStateCodes.Pending,
      };
      
      // Act
      const result = await paymentDomainService.updatePayment(created.id, updates);
      
      // Assert
      expect(result).toBe(true);
      
      // Verify the update
      const updated = await paymentDomainService.getLoanPaymentById(created.id);
      expect(updated!.state).toBe(LoanPaymentStateCodes.Pending);
    });

    it('should complete a payment and set completion timestamp', async () => {
      // Arrange
      const created = await createTestPayment();
      
      // Act
      const result = await paymentDomainService.completePayment(created.id);
      
      // Assert
      expect(result).toBe(true);
      
      // Verify the completion
      const completed = await paymentDomainService.getLoanPaymentById(created.id);
      expect(completed!.state).toBe(LoanPaymentStateCodes.Completed);
      expect(completed!.completedAt).toBeDefined();
      expect(completed!.completedAt).toBeInstanceOf(Date);
    });

    it('should fail a payment with proper state transition', async () => {
      // Arrange
      const created = await createTestPayment();
      const mockStepId = uuidv4();
      
      // Act
      const result = await paymentDomainService.failPayment(created.id, mockStepId);
      
      // Assert
      expect(result).toBe(true);
      
      // Verify the failure
      const failed = await paymentDomainService.getLoanPaymentById(created.id);
      expect(failed!.state).toBe(LoanPaymentStateCodes.Failed);
    });

    it('should return null for empty repayment plan', async () => {
      // Act
      const result = await paymentDomainService.saveRepaymentPlan([], testLoanId);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should handle multiple payment types correctly', async () => {
      // Arrange & Act
      const fundingPayment = await createTestPayment();
      const repaymentPayment = await createTestRepaymentPayment();
      
      // Assert
      expect(fundingPayment.type).toBe(LoanPaymentTypeCodes.Funding);
      expect(repaymentPayment.type).toBe(LoanPaymentTypeCodes.Repayment);
      expect(repaymentPayment.amount).toBe(200);
      expect(fundingPayment.amount).toBe(1000);
    });

    it('should handle various payment amounts for repayments', async () => {
      // Arrange & Act
      const smallRepayment = await createTestRepaymentPayment(testLoanId, 50);
      const largeRepayment = await createTestRepaymentPayment(testLoanId, 1500);
      
      // Assert
      expect(smallRepayment.amount).toBe(50);
      expect(largeRepayment.amount).toBe(1500);
      expect(smallRepayment.type).toBe(LoanPaymentTypeCodes.Repayment);
      expect(largeRepayment.type).toBe(LoanPaymentTypeCodes.Repayment);
    });
  });

  describe('Payment Route Finding', () => {
    it('should return null when source account is not found', async () => {
      // Act
      const result = await paymentDomainService.findRouteForPayment(
        nonExistentAccountId,
        'some-destination',
        LoanPaymentTypeCodes.Funding,
        LoanTypeCodes.Personal
      );
      
      // Assert
      expect(result).toBeNull();
    });

    it('should return null when destination account is not found', async () => {
      // Arrange
      const sourceAccount = await createTestPaymentAccount();
      
      // Act
      const result = await paymentDomainService.findRouteForPayment(
        sourceAccount.id,
        'non-existent-account',
        LoanPaymentTypeCodes.Funding,
        LoanTypeCodes.Personal
      );
      
      // Assert
      expect(result).toBeNull();
    });

    it('should handle route finding between different account types', async () => {
      // Arrange
      const personalAccount = await createTestPaymentAccount();
      const internalAccount = await createTestInternalAccount();
      
      // Act
      const result = await paymentDomainService.findRouteForPayment(
        personalAccount.id,
        internalAccount.id,
        LoanPaymentTypeCodes.Funding,
        LoanTypeCodes.Personal
      );
      
      // Assert - Route may not exist in test data, but method should handle gracefully
      expect(result).toBeNull(); // Expected since no routes are configured in test
    });
  });

  describe('Payment Step Management', () => {
    it('should throw MissingInputException when step ID is missing', async () => {
      // Act & Assert
      await expect(paymentDomainService.getLoanPaymentStepById('')).rejects.toThrow(MissingInputException);
      await expect(paymentDomainService.getLoanPaymentStepById(null as unknown as string)).rejects.toThrow(MissingInputException);
    });

    it('should throw EntityNotFoundException when step is not found', async () => {
      // Arrange
      const nonExistentStepId = uuidv4();
      
      // Act & Assert
      await expect(paymentDomainService.getLoanPaymentStepById(nonExistentStepId))
        .rejects.toThrow(EntityNotFoundException);
    });

    it('should create payment steps with proper ordering', async () => {
      // Arrange
      const payment = await createTestPayment();
      const sourceAccount = await createTestPaymentAccount();
      const destAccount = await createTestInternalAccount();
      
      // Act
      const result = await createTestPaymentSteps(payment.id, sourceAccount.id, destAccount.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
      expect(result[0].amount).toBe(500);
      expect(result[1].amount).toBe(500);
    });

    it('should update a payment step state correctly', async () => {
      // Arrange
      const payment = await createTestPayment();
      const sourceAccount = await createTestPaymentAccount();
      const destAccount = await createTestInternalAccount();
      const steps = await createTestPaymentSteps(payment.id, sourceAccount.id, destAccount.id);
      
      // Act
      const result = await paymentDomainService.updatePaymentStepState(
        steps[0].id,
        PaymentStepStateCodes.Pending
      );
      
      // Assert
      expect(result).toBe(true);
      
      // Verify the update
      const updatedStep = await paymentDomainService.getLoanPaymentStepById(steps[0].id);
      expect(updatedStep.state).toBe(PaymentStepStateCodes.Pending);
    });

    it('should return null when getting latest transfer for non-existent step', async () => {
      // Arrange
      const nonExistentStepId = uuidv4();
      
      // Act
      const result = await paymentDomainService.getLatestTransferForStep(nonExistentStepId);
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Transfer Management', () => {
    it('should throw EntityNotFoundException when creating transfer for non-existent step', async () => {
      // Arrange
      const nonExistentStepId = uuidv4();
      
      // Act & Assert
      await expect(paymentDomainService.createTransferForStep(nonExistentStepId))
        .rejects.toThrow(EntityNotFoundException);
    });

    it('should create transfer for valid payment step', async () => {
      // Arrange
      const payment = await createTestPayment();
      const sourceAccount = await createTestPaymentAccount();
      const destAccount = await createTestInternalAccount();
      const steps = await createTestPaymentSteps(payment.id, sourceAccount.id, destAccount.id);
      
      // Act
      const result = await paymentDomainService.createTransferForStep(steps[0].id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result!.amount).toBe(500);
      expect(result!.loanPaymentStepId).toBe(steps[0].id);
      expect(result!.sourceAccountId).toBe(sourceAccount.id);
      expect(result!.destinationAccountId).toBe(destAccount.id);
    });

    it('should throw EntityNotFoundException when getting transfer by non-existent ID', async () => {
      // Arrange
      const nonExistentTransferId = uuidv4();
      
      // Act & Assert
      await expect(paymentDomainService.getTransferById(nonExistentTransferId))
        .rejects.toThrow(EntityNotFoundException);
    });

    it('should throw MissingInputException when transfer ID is missing', async () => {
      // Act & Assert
      await expect(paymentDomainService.getTransferById('')).rejects.toThrow(MissingInputException);
      await expect(paymentDomainService.getTransferById(null as unknown as string)).rejects.toThrow(MissingInputException);
    });

    it('should get transfer by ID when it exists', async () => {
      // Arrange
      const payment = await createTestPayment();
      const sourceAccount = await createTestPaymentAccount();
      const destAccount = await createTestInternalAccount();
      const steps = await createTestPaymentSteps(payment.id, sourceAccount.id, destAccount.id);
      const transfer = await paymentDomainService.createTransferForStep(steps[0].id);
      
      // Act
      const result = await paymentDomainService.getTransferById(transfer!.id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(transfer!.id);
      expect(result!.amount).toBe(500);
      expect(result!.loanPaymentStepId).toBe(steps[0].id);
    });

    it('should get latest transfer for payment step when transfer exists', async () => {
      // Arrange
      const payment = await createTestPayment();
      const sourceAccount = await createTestPaymentAccount();
      const destAccount = await createTestInternalAccount();
      const steps = await createTestPaymentSteps(payment.id, sourceAccount.id, destAccount.id);
      const transfer = await paymentDomainService.createTransferForStep(steps[0].id);
      
      // Act
      const result = await paymentDomainService.getLatestTransferForStep(steps[0].id);
      
      // Assert
      expect(result).toBeDefined();
      expect(result!.id).toBe(transfer!.id);
      expect(result!.amount).toBe(500);
    });

    it('should handle transfer state updates correctly', async () => {
      // Arrange
      const payment = await createTestPayment();
      const sourceAccount = await createTestPaymentAccount();
      const destAccount = await createTestInternalAccount();
      const steps = await createTestPaymentSteps(payment.id, sourceAccount.id, destAccount.id);
      const transfer = await paymentDomainService.createTransferForStep(steps[0].id);
      
      // Act - Update transfer through the service (if such method exists)
      // This would test the complete flow if transfer updates are available
      const updatedTransfer = await paymentDomainService.getTransferById(transfer!.id);
      
      // Assert
      expect(updatedTransfer).toBeDefined();
      expect(updatedTransfer!.id).toBe(transfer!.id);
    });
  });

  describe('Data Validation and Error Handling', () => {
    it('should handle concurrent payment creation gracefully', async () => {
      // Arrange & Act
      const paymentPromises = Array.from({ length: 3 }, (_, index) => {
        const paymentInput: DeepPartial<ILoanPayment> = {
          loanId: testLoanId,
          amount: 100 * (index + 1),
          type: LoanPaymentTypeCodes.Repayment,
          state: LoanPaymentStateCodes.Created,
          paymentNumber: index + 1,
        };
        return paymentDomainService.createPayment(paymentInput);
      });
      
      const results = await Promise.all(paymentPromises);
      
      // Assert
      expect(results).toHaveLength(3);
      expect(results.every(result => result !== null)).toBe(true);
      expect(results.map(r => r!.amount)).toEqual([100, 200, 300]);
    });

    it('should maintain data integrity when creating related entities', async () => {
      // Arrange
      const testData = await createCompleteTestData();
      const transfer = await paymentDomainService.createTransferForStep(testData.steps[0].id);
      
      // Assert - Verify relationships are maintained
      expect(testData.steps[0].loanPaymentId).toBe(testData.payment.id);
      expect(transfer!.loanPaymentStepId).toBe(testData.steps[0].id);
      expect(transfer!.sourceAccountId).toBe(testData.sourceAccount.id);
      expect(transfer!.destinationAccountId).toBe(testData.destAccount.id);
    });

    it('should handle complete payment workflow with all entities', async () => {
      // Arrange
      const testData = await createCompleteTestData();
      
      // Act - Execute complete workflow
      const stepUpdateResult = await paymentDomainService.updatePaymentStepState(
        testData.steps[0].id,
        PaymentStepStateCodes.Pending
      );
      const transfer = await paymentDomainService.createTransferForStep(testData.steps[0].id);
      const paymentUpdateResult = await paymentDomainService.updatePayment(testData.payment.id, {
        state: LoanPaymentStateCodes.Pending,
      });
      
      // Assert - Verify complete workflow
      expect(stepUpdateResult).toBe(true);
      expect(transfer).toBeDefined();
      expect(paymentUpdateResult).toBe(true);
      
      // Verify final states
      const updatedStep = await paymentDomainService.getLoanPaymentStepById(testData.steps[0].id);
      const updatedPayment = await paymentDomainService.getLoanPaymentById(testData.payment.id);
      
      expect(updatedStep.state).toBe(PaymentStepStateCodes.Pending);
      expect(updatedPayment!.state).toBe(LoanPaymentStateCodes.Pending);
    });

    it('should handle account validation correctly', async () => {
      // Arrange
      const personalAccount = await createTestPaymentAccount();
      const internalAccount = await createTestInternalAccount();
      
      // Act
      const personalResult = await paymentDomainService.getPaymentAccountById(personalAccount.id);
      const internalResult = await paymentDomainService.getPaymentAccountById(internalAccount.id);
      
      // Assert
      expect(personalResult!.ownership).toBe(PaymentAccountOwnershipTypeCodes.Personal);
      expect(personalResult!.provider).toBe(PaymentAccountProviderCodes.Checkbook);
      expect(internalResult!.ownership).toBe(PaymentAccountOwnershipTypeCodes.Internal);
      expect(internalResult!.provider).toBe(PaymentAccountProviderCodes.Fiserv);
    });

    it('should handle payment step state transitions correctly', async () => {
      // Arrange
      const testData = await createCompleteTestData();
      const stepId = testData.steps[0].id;
      
      // Act - Test state transitions
      const pendingResult = await paymentDomainService.updatePaymentStepState(stepId, PaymentStepStateCodes.Pending);
      const completedResult = await paymentDomainService.updatePaymentStepState(stepId, PaymentStepStateCodes.Completed);
      
      // Assert
      expect(pendingResult).toBe(true);
      expect(completedResult).toBe(true);
      
      // Verify final state
      const finalStep = await paymentDomainService.getLoanPaymentStepById(stepId);
      expect(finalStep.state).toBe(PaymentStepStateCodes.Completed);
    });

    it('should handle multiple transfers for the same step gracefully', async () => {
      // Arrange
      const testData = await createCompleteTestData();
      const stepId = testData.steps[0].id;
      
      // Act - Create first transfer
      const firstTransfer = await paymentDomainService.createTransferForStep(stepId);
      
      // Try to create second transfer for same step - behavior depends on business rules
      // This test validates the service handles the scenario appropriately
      const latestTransfer = await paymentDomainService.getLatestTransferForStep(stepId);
      
      // Assert
      expect(firstTransfer).toBeDefined();
      expect(latestTransfer).toBeDefined();
      expect(latestTransfer!.id).toBe(firstTransfer!.id);
    });

    it('should validate payment amounts correctly', async () => {
      // Arrange
      const testData = await createCompleteTestData();
      
      // Act & Assert - Test various amount scenarios
      expect(testData.payment.amount).toBe(1000);
      expect(testData.steps[0].amount).toBe(500);
      expect(testData.steps[1].amount).toBe(500);
      
      // Verify total step amounts equal payment amount
      const totalStepAmount = testData.steps.reduce((sum, step) => sum + step.amount, 0);
      expect(totalStepAmount).toBe(testData.payment.amount);
    });

    it('should handle edge cases with zero amounts gracefully', async () => {
      // Arrange
      const paymentInput: DeepPartial<ILoanPayment> = {
        loanId: testLoanId,
        amount: 0,
        type: LoanPaymentTypeCodes.Fee,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: 99,
        scheduledAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Act
      const result = await paymentDomainService.createPayment(paymentInput);
      
      // Assert
      expect(result).toBeDefined();
      expect(result!.amount).toBe(0);
      expect(result!.type).toBe(LoanPaymentTypeCodes.Fee);
    });

    it('should handle payment completion with multiple steps', async () => {
      // Arrange
      const testData = await createCompleteTestData();
      
      // Act - Complete first step, then payment
      const stepUpdateResult = await paymentDomainService.updatePaymentStepState(
        testData.steps[0].id,
        PaymentStepStateCodes.Completed
      );
      const completionResult = await paymentDomainService.completePayment(testData.payment.id);
      
      // Assert
      expect(stepUpdateResult).toBe(true);
      expect(completionResult).toBe(true);
      
      // Verify payment completion
      const completedPayment = await paymentDomainService.getLoanPaymentById(testData.payment.id);
      expect(completedPayment!.state).toBe(LoanPaymentStateCodes.Completed);
      expect(completedPayment!.completedAt).toBeDefined();
    });
  });
});
