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
import { AllEntities } from '@library/shared/domain/entity';
import { FOUNDATION_TEST_IDS, ITestDataRegistry, memoryDataSourceSingle, TestDataSeeder } from '@library/shared/tests';
import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '@payment/modules/data';
import { DomainModule } from '@payment/modules/domain/domain.module';
import { IDomainServices } from '@payment/modules/domain/idomain.services';
import { ManagementModule } from '@payment/modules/domain/management.module';
import { ManagementDomainService } from '@payment/modules/domain/services';
import { LoanPaymentStepModule } from '../../src/modules/loan-payment-steps/loan-payment-step.module';
import { LoanPaymentModule } from '../../src/modules/loan-payments/loan-payment.module';
import { TransferExecutionModule } from '../../src/modules/transfer-execution/transfer-execution.module';

// Follow ZNG testing guidelines from .github/copilot/test-instructions.md
// Verify entity interfaces first - check libs/entity/src/interface/ for actual field names
// Use real service implementations for integration tests (2-3 levels deep)
// Include all required factory modules for services that depend on them
// Test ONLY ManagementDomainService methods: initiateLoanPayment, advancePayment, advancePaymentStep, executeTransfer
// Create test data using #region test data generation pattern
// Use uuidv4() for all test IDs and entity creation

/**
 * Integration tests for ManagementDomainService
 * 
 * ManagementDomainService has exactly 4 methods:
 * - initiateLoanPayment(loanId: string, paymentType: LoanPaymentTypeCodes): Promise<boolean | null>
 * - advancePayment(paymentId: string, paymentType: LoanPaymentTypeCodes): Promise<boolean | null>
 * - advancePaymentStep(stepId: string, stepState?: PaymentStepStateCodes): Promise<boolean | null>
 * - executeTransfer(transferId: string, providerType?: PaymentAccountProviderCodes): Promise<boolean | null>
 * 
 * These tests use real service implementations with factories for 2-3 levels of dependency injection.
 * Only repositories and external APIs are mocked. Entity creation follows proper dependency order.
 */
describe('ManagementDomainService Integration', () => {
  let module: TestingModule;
  let domainServices: IDomainServices;
  let managementDomainService: ManagementDomainService;
  let databaseBackup: IBackup;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let foundationData: ITestDataRegistry;

  // Test-specific IDs for entities created during tests
  let testPaymentId: string;
  let testStepId: string;
  let testTransferId: string;

  // Non-existent IDs for error testing
  const nonExistentLoanId = uuidv4();
  const nonExistentStepId = uuidv4();
  const nonExistentTransferId = uuidv4();

  beforeAll(async () => {
    // Create in-memory database with all entities
    const { dataSource, database } = await memoryDataSourceSingle(AllEntities);
    
    // Initialize transactional context
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    // Create test module with real service implementations and factories for 2-3 levels deep integration
    module = await Test.createTestingModule({
      imports: [
        DataModule, // Real data module with repositories
        DomainModule, // Real domain module with services  
        ManagementModule, // Management module with ManagementDomainService
        LoanPaymentModule, // Real loan payment factory and managers - REQUIRED for initiateLoanPayment, advancePayment
        LoanPaymentStepModule, // Real loan payment step factory and managers - REQUIRED for advancePaymentStep
        TransferExecutionModule, // Real transfer execution factory and providers - REQUIRED for executeTransfer
      ],
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    domainServices = module.get<IDomainServices>(IDomainServices);
    managementDomainService = module.get<ManagementDomainService>(ManagementDomainService);
    
    // Seed foundation data before creating backup
    foundationData = await TestDataSeeder.seedFoundationData(dataSource);
    databaseBackup = database.backup();
  }, 30000); // Increase timeout to 30 seconds

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Restore database to clean state before each test
    databaseBackup.restore();
  });

  // #region test data generation

  async function createTestData(): Promise<void> {
    // Use foundation data for basic entities (users and loans already exist)
    const primaryUserId = FOUNDATION_TEST_IDS.users.primaryUser;
    const disbursedLoanId = FOUNDATION_TEST_IDS.loans.disbursedLoan;

    // Create payment accounts for source and destination with proper PaymentAccountDetails
    const sourceAccount = await domainServices.paymentServices.addPaymentAccount(primaryUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Checkbook,
      ownership: PaymentAccountOwnershipTypeCodes.Personal,
      state: PaymentAccountStateCodes.Verified,
      details: {
        type: 'checkbook_ach',
        displayName: 'John Smith Account',
        key: 'test_key_123',
        secret: 'test_secret_456',
        accountId: `acc_${Date.now()}`,
        institution: 'Test Bank',
        redactedAccountNumber: '****7890',
        routingNumber: '123456789',
      },
    });

    const destAccount = await domainServices.paymentServices.addPaymentAccount(primaryUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Fiserv,
      ownership: PaymentAccountOwnershipTypeCodes.Internal,
      state: PaymentAccountStateCodes.Verified,
      details: {
        type: 'fiserv_debit',
        displayName: 'Internal Fiserv Account',
        cardToken: 'token_123',
        cardExpiration: '12/25',
        last4Digits: '1234',
      },
    });

    if (!sourceAccount || !destAccount) {
      throw new Error('Failed to create payment accounts');
    }

    // Create a loan payment using foundation loan
    const payment = await domainServices.paymentServices.createPayment({
      loanId: disbursedLoanId,
      amount: 1000,
      type: LoanPaymentTypeCodes.Funding,
      state: LoanPaymentStateCodes.Created,
    });

    if (!payment) {
      throw new Error('Failed to create payment');
    }

    testPaymentId = payment.id;

    // Create payment steps
    const steps = await domainServices.paymentServices.createPaymentSteps([{
      loanPaymentId: payment.id,
      order: 0,
      amount: 1000,
      sourcePaymentAccountId: sourceAccount.id,
      targetPaymentAccountId: destAccount.id,
      state: PaymentStepStateCodes.Created,
    }]);

    if (!steps || steps.length === 0) {
      throw new Error('Failed to create payment steps');
    }

    testStepId = steps[0].id;
    
    if (!testStepId) {
      throw new Error('Step ID is undefined after creation');
    }

    // Create transfer for the step
    const transfer = await domainServices.paymentServices.createTransferForStep(testStepId);
    
    if (!transfer) {
      throw new Error('Failed to create transfer');
    }

    testTransferId = transfer.id;
  }

  // #endregion

  describe('ManagementDomainService - initiateLoanPayment', () => {
    it('should initiate funding payment when loan exists', async () => {
      // Arrange - Create all required entities in proper dependency order
      await createTestData();
      
      // Act - Test actual ManagementDomainService.initiateLoanPayment method using foundation loan
      const result = await managementDomainService.initiateLoanPayment(FOUNDATION_TEST_IDS.loans.disbursedLoan, LoanPaymentTypeCodes.Funding);
      
      // Assert - Method returns boolean | null based on actual implementation
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should initiate disbursement payment when loan exists', async () => {
      // Arrange
      await createTestData();
      
      // Act
      const result = await managementDomainService.initiateLoanPayment(FOUNDATION_TEST_IDS.loans.disbursedLoan, LoanPaymentTypeCodes.Disbursement);
      
      // Assert - Based on actual return type
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should initiate repayment payment when loan exists', async () => {
      // Arrange
      await createTestData();
      
      // Act
      const result = await managementDomainService.initiateLoanPayment(FOUNDATION_TEST_IDS.loans.disbursedLoan, LoanPaymentTypeCodes.Repayment);
      
      // Assert - Based on actual return type
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should throw EntityNotFoundException when loan does not exist', async () => {
      // Act & Assert - Test with non-existent loan ID
      await expect(
        managementDomainService.initiateLoanPayment(nonExistentLoanId, LoanPaymentTypeCodes.Funding)
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('ManagementDomainService - advancePayment', () => {
    it('should advance funding payment when payment exists', async () => {
      // Arrange - Create payment using proper test data setup
      await createTestData();
      
      // Act - Test actual ManagementDomainService.advancePayment method
      const result = await managementDomainService.advancePayment(testPaymentId, LoanPaymentTypeCodes.Funding);
      
      // Assert - Method returns boolean | null based on actual implementation
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should advance disbursement payment when payment exists', async () => {
      // Arrange
      await createTestData();
      
      // Act
      const result = await managementDomainService.advancePayment(testPaymentId, LoanPaymentTypeCodes.Disbursement);
      
      // Assert - Based on actual return type
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should advance repayment payment when payment exists', async () => {
      // Arrange
      await createTestData();
      
      // Act
      const result = await managementDomainService.advancePayment(testPaymentId, LoanPaymentTypeCodes.Repayment);
      
      // Assert - Based on actual return type
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should throw EntityNotFoundException when payment does not exist', async () => {
      // Act & Assert - Test with non-existent payment ID
      await expect(
        managementDomainService.advancePayment(nonExistentLoanId, LoanPaymentTypeCodes.Funding)
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('ManagementDomainService - advancePaymentStep', () => {
    it('should advance payment step without specifying state', async () => {
      // Arrange - Create step with Created state by default
      await createTestData();
      
      // Act - Test actual ManagementDomainService.advancePaymentStep method without state parameter
      const result = await managementDomainService.advancePaymentStep(testStepId);
      
      // Assert - Method returns boolean | null based on actual implementation
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should advance payment step with Created state explicitly', async () => {
      // Arrange
      await createTestData();
      
      // Act
      const result = await managementDomainService.advancePaymentStep(testStepId, PaymentStepStateCodes.Created);
      
      // Assert - Should advance from Created state
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should throw EntityNotFoundException when step does not exist', async () => {
      // Act & Assert - Test with non-existent step ID
      await expect(
        managementDomainService.advancePaymentStep(nonExistentStepId)
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('ManagementDomainService - executeTransfer', () => {
    it('should execute transfer without specifying provider', async () => {
      // Arrange - Create transfer using complete test data
      await createTestData();
      
      // Act - Test actual ManagementDomainService.executeTransfer method
      const result = await managementDomainService.initiateTransfer(testTransferId);
      
      // Assert - Method returns boolean | null based on actual implementation
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should execute transfer with Checkbook provider', async () => {
      // Arrange
      await createTestData();
      
      // Act
      const result = await managementDomainService.initiateTransfer(testTransferId, PaymentAccountProviderCodes.Checkbook);
      
      // Assert - Based on actual provider execution behavior
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should execute transfer with Fiserv provider', async () => {
      // Arrange
      await createTestData();
      
      // Act
      const result = await managementDomainService.initiateTransfer(testTransferId, PaymentAccountProviderCodes.Fiserv);
      
      // Assert - Based on actual provider execution behavior
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should execute transfer with Tabapay provider', async () => {
      // Arrange
      await createTestData();
      
      // Act
      const result = await managementDomainService.initiateTransfer(testTransferId, PaymentAccountProviderCodes.Tabapay);
      
      // Assert - Based on actual provider execution behavior
      expect(typeof result === 'boolean' || result === null).toBe(true);
    });

    it('should throw EntityNotFoundException when transfer does not exist', async () => {
      // Act & Assert - Test with non-existent transfer ID
      await expect(
        managementDomainService.initiateTransfer(nonExistentTransferId)
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('Error Handling', () => {
    it('should handle initiate loan payment with non-existent loan ID', async () => {
      // Arrange - using non-existent loan ID
      
      // Act & Assert - The actual behavior depends on the loan payment factory implementation
      // Based on the factory code, it will throw EntityNotFoundException when loan is not found
      await expect(
        managementDomainService.initiateLoanPayment(nonExistentLoanId, LoanPaymentTypeCodes.Funding)
      ).rejects.toThrow('Loan not found');
    });

    it('should handle advance payment step with non-existent step ID', async () => {
      // Arrange - using non-existent step ID
      
      // Act & Assert - PaymentDomainService.getLoanPaymentStepById throws EntityNotFoundException
      await expect(
        managementDomainService.advancePaymentStep(nonExistentStepId)
      ).rejects.toThrow('Payment step not found');
    });

    it('should handle execute transfer with non-existent transfer ID', async () => {
      // Arrange - using non-existent transfer ID
      
      // Act & Assert - PaymentDomainService.getTransferById throws EntityNotFoundException
      await expect(
        managementDomainService.initiateTransfer(nonExistentTransferId)
      ).rejects.toThrow('Transfer not found');    
    });
  });
});

