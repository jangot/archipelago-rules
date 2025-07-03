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
} from '@library/entity/entity-interface';
import { 
  LoanPaymentTypeCodes,
  LoanPaymentStateCodes,
  PaymentAccountProviderCodes,
  PaymentStepStateCodes,
} from '@library/entity/enum';
import { LoanPaymentModule } from '../../src/loan-payments/loan-payment.module';
import { LoanPaymentStepModule } from '../../src/loan-payment-steps/loan-payment-step.module';
import { TransferExecutionModule } from '../../src/transfer-execution/transfer-execution.module';
import { 
  memoryDataSourceSingle,
  TestDataSeeder,
  FOUNDATION_TEST_IDS,
  TestPaymentAccountFactory,
} from '@library/shared/tests';
import { AllEntities } from '@library/shared/domain/entity';
import { EntityNotFoundException } from '@library/shared/common/exception/domain';

// Follow ZNG testing guidelines from .github/copilot/test-instructions.md
// Verify entity interfaces first - check libs/entity/src/interface/ for actual field names
// Use real service implementations for integration tests (2-3 levels deep)
// Test complete payment process flows using actual service implementations
// Create test data using #region test data generation pattern
// Use uuidv4() for all test IDs and entity creation

/**
 * Integration tests for Payment Process Flow
 * 
 * These tests verify end-to-end payment processing flows using real service implementations.
 * Tests coordinate multiple services: LoanPaymentService, LoanPaymentStepService, 
 * TransferExecutionService, and ManagementDomainService with real factory implementations.
 * 
 * Uses hybrid test data approach with foundation data for optimal performance.
 * Only repositories and external APIs are mocked. All business logic services use
 * real implementations to test actual integration behavior.
 */
describe('Payment Process Flow Integration', () => {
  let module: TestingModule;
  let domainServices: IDomainServices;
  let managementDomainService: ManagementDomainService;
  let loanPaymentService: LoanPaymentService;
  let loanPaymentStepService: LoanPaymentStepService;
  let transferExecutionService: TransferExecutionService;
  let databaseBackup: IBackup;

  // Use uuidv4() for all test IDs and entity creation
  const nonExistentPaymentId = uuidv4();
  const nonExistentStepId = uuidv4();
  const nonExistentTransferId = uuidv4();

  beforeAll(async () => {
    // Follow ZNG testing guidelines from .github/copilot/test-instructions.md
    // Follow memoryDataSourceSingle pattern for database setup
    const { dataSource, database } = await memoryDataSourceSingle(AllEntities);
    
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
    
    // Seed foundation data BEFORE creating backup
    await TestDataSeeder.seedFoundationData(dataSource);
    databaseBackup = database.backup();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    // Restore database to state WITH foundation data
    databaseBackup.restore();
  });

  // #region test data generation

  /**
   * Creates a test lender payment account using TestPaymentAccountFactory
   * @returns Promise resolving to the created payment account
   */
  async function createTestLenderAccount(): Promise<IPaymentAccount> {
    const accountData = TestPaymentAccountFactory.createCheckbookBankAccount('Test Lender Account');
    const account = await domainServices.paymentServices.addPaymentAccount(
      FOUNDATION_TEST_IDS.users.lenderUser, 
      accountData as any
    );
    
    if (!account) {
      throw new Error('Failed to create lender account');
    }
    
    return account;
  }

  /**
   * Creates a test borrower payment account using TestPaymentAccountFactory
   * @returns Promise resolving to the created payment account
   */
  async function createTestBorrowerAccount(): Promise<IPaymentAccount> {
    const accountData = TestPaymentAccountFactory.createCheckbookBankAccount('Test Borrower Account');
    const account = await domainServices.paymentServices.addPaymentAccount(
      FOUNDATION_TEST_IDS.users.borrowerUser, 
      accountData as any
    );
    
    if (!account) {
      throw new Error('Failed to create borrower account');
    }
    
    return account;
  }

  /**
   * Creates a test internal payment account using TestPaymentAccountFactory
   * @returns Promise resolving to the created internal payment account
   */
  async function createTestInternalAccount(): Promise<IPaymentAccount> {
    const accountData = TestPaymentAccountFactory.createFiservDebitAccount('Internal Platform Account');
    const account = await domainServices.paymentServices.addPaymentAccount(
      FOUNDATION_TEST_IDS.users.primaryUser, 
      accountData as any
    );
    
    if (!account) {
      throw new Error('Failed to create internal account');
    }
    
    return account;
  }

  // #endregion

  describe('Payment Service Integration', () => {
    it('should initiate loan payment for existing loan', async () => {
      // Act
      const result = await loanPaymentService.initiatePayment(FOUNDATION_TEST_IDS.loans.disbursedLoan, LoanPaymentTypeCodes.Funding);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should throw EntityNotFoundException when initiating payment for non-existent loan', async () => {
      // Act & Assert
      await expect(
        loanPaymentService.initiatePayment(nonExistentPaymentId, LoanPaymentTypeCodes.Funding)
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should advance loan payment when payment exists', async () => {
      // Arrange - Create a payment first
      const payment = await domainServices.paymentServices.createPayment({
        loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: 1,
      });

      if (!payment) {
        throw new Error('Failed to create test payment for advancement test');
      }

      // Act
      const result = await loanPaymentService.advancePayment(payment.id, LoanPaymentTypeCodes.Funding);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should throw EntityNotFoundException when advancing non-existent payment', async () => {
      // Act & Assert
      await expect(
        loanPaymentService.advancePayment(nonExistentPaymentId, LoanPaymentTypeCodes.Funding)
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('Payment Step Service Integration', () => {
    let testStep: ILoanPaymentStep;

    beforeEach(async () => {
      // Arrange - Create payment accounts using helper functions
      const sourceAccount = await createTestLenderAccount();
      const destAccount = await createTestInternalAccount();

      // Create a payment
      const payment = await domainServices.paymentServices.createPayment({
        loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: 1,
      });

      if (!payment) {
        throw new Error('Failed to create test payment for payment step tests');
      }

      // Create payment step
      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount.id,
        targetPaymentAccountId: destAccount.id,
        state: PaymentStepStateCodes.Created,
      }]);

      if (!steps || steps.length === 0) {
        throw new Error('Failed to create test payment step');
      }

      testStep = steps[0];
    });

    it('should advance payment step successfully', async () => {
      // Act
      const result = await loanPaymentStepService.advanceStep(testStep.id);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should advance payment step with specific state', async () => {
      // Act
      const result = await loanPaymentStepService.advanceStep(testStep.id, PaymentStepStateCodes.Created);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should throw EntityNotFoundException when advancing non-existent step', async () => {
      // Act & Assert
      await expect(
        loanPaymentStepService.advanceStep(nonExistentStepId)
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should throw PaymentStepStateIsOutOfSyncException when advancing step with invalid state transition', async () => {
      // Arrange - Create a step first
      const sourceAccount = await createTestLenderAccount();
      const destAccount = await createTestInternalAccount();

      const payment = await domainServices.paymentServices.createPayment({
        loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: 1,
      });

      if (!payment) {
        throw new Error('Failed to create test payment for invalid state test');
      }

      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount.id,
        targetPaymentAccountId: destAccount.id,
        state: PaymentStepStateCodes.Created,
      }]);

      if (!steps || steps.length === 0) {
        throw new Error('Failed to create test payment step for invalid state test');
      }

      // Act & Assert - Try to advance with an invalid transition state should throw PaymentStepStateIsOutOfSyncException
      await expect(
        loanPaymentStepService.advanceStep(steps[0].id, PaymentStepStateCodes.Completed)
      ).rejects.toThrow(`Step: ${steps[0].id} is in Completed state, but no Transfers found.`);
    });
  });

  describe('Transfer Execution Service Integration', () => {
    let testTransferId: string;

    beforeEach(async () => {
      // Arrange - Create payment accounts using helper functions
      const sourceAccount = await createTestLenderAccount();
      const destAccount = await createTestInternalAccount();

      // Create a payment and step
      const payment = await domainServices.paymentServices.createPayment({
        loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: 1,
      });

      if (!payment) {
        throw new Error('Failed to create test payment for transfer execution tests');
      }

      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount.id,
        targetPaymentAccountId: destAccount.id,
        state: PaymentStepStateCodes.Created,
      }]);

      if (!steps || steps.length === 0) {
        throw new Error('Failed to create test payment step for transfer execution tests');
      }

      // Create transfer for the step
      const transfer = await domainServices.paymentServices.createTransferForStep(steps[0].id);
      if (!transfer) {
        throw new Error('Failed to create test transfer');
      }
      testTransferId = transfer.id;
    });

    it('should execute transfer successfully', async () => {
      // Act
      const result = await transferExecutionService.executeTransfer(testTransferId);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should execute transfer with specific provider', async () => {
      // Act
      const result = await transferExecutionService.executeTransfer(testTransferId, PaymentAccountProviderCodes.Checkbook);
      
      // Assert
      expect(result).toBeDefined();
    });

    it('should throw EntityNotFoundException when executing non-existent transfer', async () => {
      // Act & Assert
      await expect(
        transferExecutionService.executeTransfer(nonExistentTransferId)
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should handle transfer execution with different providers', async () => {
      // Arrange - Create transfer for different provider test
      const sourceAccount = await createTestLenderAccount();
      const destAccount = await createTestInternalAccount();

      const payment = await domainServices.paymentServices.createPayment({
        loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: 1,
      });

      if (!payment) {
        throw new Error('Failed to create test payment for provider test');
      }

      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount.id,
        targetPaymentAccountId: destAccount.id,
        state: PaymentStepStateCodes.Created,
      }]);

      if (!steps || steps.length === 0) {
        throw new Error('Failed to create test payment step for provider test');
      }

      const transfer = await domainServices.paymentServices.createTransferForStep(steps[0].id);
      if (!transfer) {
        throw new Error('Failed to create test transfer for provider test');
      }

      // Act - Execute with different providers
      const fiservResult = await transferExecutionService.executeTransfer(transfer.id, PaymentAccountProviderCodes.Fiserv);
      
      // Assert
      expect(fiservResult).toBeDefined();
    });
  });

  describe('End-to-End Payment Flow', () => {
    let lenderAccount: IPaymentAccount;
    let borrowerAccount: IPaymentAccount;
    let platformAccount: IPaymentAccount;

    beforeEach(async () => {
      // Create all payment accounts using helper functions
      lenderAccount = await createTestLenderAccount();
      borrowerAccount = await createTestBorrowerAccount();
      platformAccount = await createTestInternalAccount();
    });

    it('should create and manage funding payment', async () => {
      // Arrange
      let paymentNumber = 1;

      // Act - Create funding payment
      const fundingPayment = await domainServices.paymentServices.createPayment({
        loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: paymentNumber++,
      });

      // Assert
      expect(fundingPayment).toBeDefined();
      expect(fundingPayment!.type).toBe(LoanPaymentTypeCodes.Funding);
      expect(fundingPayment!.state).toBe(LoanPaymentStateCodes.Created);

      // Act - Advance the payment
      const advanceResult = await loanPaymentService.advancePayment(fundingPayment!.id, LoanPaymentTypeCodes.Funding);
      
      // Assert
      expect(advanceResult).toBeDefined();
    });

    it('should create and manage disbursement payment', async () => {
      // Arrange
      let paymentNumber = 1;

      // Act - Create disbursement payment
      const disbursementPayment = await domainServices.paymentServices.createPayment({
        loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
        amount: 1000,
        type: LoanPaymentTypeCodes.Disbursement,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: paymentNumber++,
      });

      // Assert
      expect(disbursementPayment).toBeDefined();
      expect(disbursementPayment!.type).toBe(LoanPaymentTypeCodes.Disbursement);
      expect(disbursementPayment!.state).toBe(LoanPaymentStateCodes.Created);

      // Act - Advance the payment
      const advanceResult = await loanPaymentService.advancePayment(disbursementPayment!.id, LoanPaymentTypeCodes.Disbursement);
      
      // Assert
      expect(advanceResult).toBeDefined();
    });

    it('should create and manage repayment payment', async () => {
      // Arrange
      let paymentNumber = 1;

      // Act - Create repayment payment
      const repaymentPayment = await domainServices.paymentServices.createPayment({
        loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
        amount: 500,
        type: LoanPaymentTypeCodes.Repayment,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: paymentNumber++,
      });

      // Assert
      expect(repaymentPayment).toBeDefined();
      expect(repaymentPayment!.type).toBe(LoanPaymentTypeCodes.Repayment);
      expect(repaymentPayment!.state).toBe(LoanPaymentStateCodes.Created);

      // Act - Advance the payment
      const advanceResult = await loanPaymentService.advancePayment(repaymentPayment!.id, LoanPaymentTypeCodes.Repayment);
      
      // Assert
      expect(advanceResult).toBeDefined();
    });

    it('should handle payment steps workflow', async () => {
      // Arrange - Create a payment
      const payment = await domainServices.paymentServices.createPayment({
        loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: 1,
      });

      if (!payment) {
        throw new Error('Failed to create test payment for workflow test');
      }

      // Act - Create payment steps
      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: lenderAccount.id,
        targetPaymentAccountId: platformAccount.id,
        state: PaymentStepStateCodes.Created,
      }]);

      // Assert
      expect(steps).toBeDefined();
      expect(steps!).toHaveLength(1);

      // Act - Advance the step
      const stepAdvanceResult = await loanPaymentStepService.advanceStep(steps![0].id);
      
      // Assert
      expect(stepAdvanceResult).toBeDefined();

      // Act - Create transfer for the step
      const transfer = await domainServices.paymentServices.createTransferForStep(steps![0].id);
      
      // Assert
      expect(transfer).toBeDefined();

      // Act - Execute the transfer
      const transferResult = await transferExecutionService.executeTransfer(transfer!.id);
      
      // Assert
      expect(transferResult).toBeDefined();
    });

    it('should handle multi-account payment flow', async () => {
      // Arrange
      let paymentNumber = 1;

      // Act - Create payment that involves multiple account types
      const payment = await domainServices.paymentServices.createPayment({
        loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
        amount: 2000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: paymentNumber++,
      });

      if (!payment) {
        throw new Error('Failed to create test payment for multi-account flow');
      }

      // Act - Create steps involving all account types
      const steps = await domainServices.paymentServices.createPaymentSteps([
        {
          loanPaymentId: payment.id,
          order: 0,
          amount: 1000,
          sourcePaymentAccountId: lenderAccount.id,
          targetPaymentAccountId: platformAccount.id,
          state: PaymentStepStateCodes.Created,
        },
        {
          loanPaymentId: payment.id,
          order: 1,
          amount: 1000,
          sourcePaymentAccountId: platformAccount.id,
          targetPaymentAccountId: borrowerAccount.id,
          state: PaymentStepStateCodes.Created,
        },
      ]);

      // Assert
      expect(steps).toBeDefined();
      expect(steps!).toHaveLength(2);
      expect(steps![0].sourcePaymentAccountId).toBe(lenderAccount.id);
      expect(steps![0].targetPaymentAccountId).toBe(platformAccount.id);
      expect(steps![1].sourcePaymentAccountId).toBe(platformAccount.id);
      expect(steps![1].targetPaymentAccountId).toBe(borrowerAccount.id);

      // Act - Advance both steps
      const stepResults = await Promise.all([
        loanPaymentStepService.advanceStep(steps![0].id),
        loanPaymentStepService.advanceStep(steps![1].id),
      ]);

      // Assert
      expect(stepResults).toHaveLength(2);
      expect(stepResults.every(r => r !== undefined)).toBe(true);
    });

    it('should coordinate multiple payment types', async () => {
      // Arrange
      let paymentNumber = 1;

      // Act - Create multiple payment types
      const payments = await Promise.all([
        domainServices.paymentServices.createPayment({
          loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
          amount: 1000,
          type: LoanPaymentTypeCodes.Funding,
          state: LoanPaymentStateCodes.Created,
          paymentNumber: paymentNumber++,
        }),
        domainServices.paymentServices.createPayment({
          loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
          amount: 1000,
          type: LoanPaymentTypeCodes.Disbursement,
          state: LoanPaymentStateCodes.Created,
          paymentNumber: paymentNumber++,
        }),
        domainServices.paymentServices.createPayment({
          loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
          amount: 500,
          type: LoanPaymentTypeCodes.Repayment,
          state: LoanPaymentStateCodes.Created,
          paymentNumber: paymentNumber++,
        }),
      ]);

      // Assert
      expect(payments).toHaveLength(3);
      expect(payments.every(p => p !== null)).toBe(true);

      // Act - Test that each payment type can be advanced
      const advanceResults = await Promise.all([
        loanPaymentService.advancePayment(payments[0]!.id, LoanPaymentTypeCodes.Funding),
        loanPaymentService.advancePayment(payments[1]!.id, LoanPaymentTypeCodes.Disbursement),
        loanPaymentService.advancePayment(payments[2]!.id, LoanPaymentTypeCodes.Repayment),
      ]);

      // Assert
      expect(advanceResults.every(r => r !== undefined)).toBe(true);
    });
  });

  describe('Domain Services Integration', () => {
    it('should have all services configured', () => {
      // Assert - Verify all services are properly injected
      expect(domainServices).toBeDefined();
      expect(domainServices.paymentServices).toBeDefined();
      expect(managementDomainService).toBeDefined();
      expect(loanPaymentService).toBeDefined();
      expect(loanPaymentStepService).toBeDefined();
      expect(transferExecutionService).toBeDefined();
    });

    it('should handle management service operations with non-existent entities', async () => {
      // Act & Assert - Test management service methods with non-existent entities
      await expect(
        managementDomainService.initiateLoanPayment(nonExistentPaymentId, LoanPaymentTypeCodes.Funding)
      ).rejects.toThrow(EntityNotFoundException);

      await expect(
        managementDomainService.advancePayment(nonExistentPaymentId, LoanPaymentTypeCodes.Funding)
      ).rejects.toThrow(EntityNotFoundException);

      await expect(
        managementDomainService.advancePaymentStep(nonExistentStepId)
      ).rejects.toThrow(EntityNotFoundException);

      await expect(
        managementDomainService.executeTransfer(nonExistentTransferId)
      ).rejects.toThrow(EntityNotFoundException);
    });

    it('should handle management service operations with existing entities', async () => {
      // Arrange - Create payment accounts and payment
      const sourceAccount = await createTestLenderAccount();
      const targetAccount = await createTestInternalAccount();
      
      const payment = await domainServices.paymentServices.createPayment({
        loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
        paymentNumber: 1,
      });

      if (!payment) {
        throw new Error('Failed to create test payment for management service test');
      }

      // Act - Test initiate loan payment with existing loan
      const initiateResult = await managementDomainService.initiateLoanPayment(
        FOUNDATION_TEST_IDS.loans.disbursedLoan, 
        LoanPaymentTypeCodes.Disbursement
      );
      
      // Assert
      expect(initiateResult).toBeDefined();

      // Act - Test advance payment with existing payment
      const advanceResult = await managementDomainService.advancePayment(payment.id, LoanPaymentTypeCodes.Funding);
      
      // Assert
      expect(advanceResult).toBeDefined();

      // Arrange - Create payment step
      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount.id,
        targetPaymentAccountId: targetAccount.id,
        state: PaymentStepStateCodes.Created,
      }]);

      if (!steps || steps.length === 0) {
        throw new Error('Failed to create test payment step for management service test');
      }

      // Act - Test advance payment step with existing step
      const stepAdvanceResult = await managementDomainService.advancePaymentStep(steps[0].id);
      
      // Assert
      expect(stepAdvanceResult).toBeDefined();

      // Arrange - Create transfer
      const transfer = await domainServices.paymentServices.createTransferForStep(steps[0].id);
      
      if (!transfer) {
        throw new Error('Failed to create test transfer for management service test');
      }

      // Act - Test execute transfer with existing transfer
      const transferResult = await managementDomainService.executeTransfer(transfer.id);
      
      // Assert
      expect(transferResult).toBeDefined();
    });
  });
});
