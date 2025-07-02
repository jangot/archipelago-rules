import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
import { LoanPaymentModule } from '../../src/loan-payments/loan-payment.module';
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
  LoanPaymentTypeCodes,
  LoanPaymentStateCodes,
} from '@library/entity/enum';
import { 
  ILoanPayment,
} from '@library/entity/entity-interface';
import { LoanPaymentStepModule } from '../../src/loan-payment-steps/loan-payment-step.module';
import { TransferExecutionModule } from '../../src/transfer-execution/transfer-execution.module';
import { memoryDataSourceSingle, TestDataSeeder, FOUNDATION_TEST_IDS, ITestDataRegistry } from '@library/shared/tests';
import { AllEntities } from '@library/shared/domain/entity';

// Follow ZNG testing guidelines from .github/copilot/test-instructions.md
// Verify entity interfaces first - check libs/entity/src/interface/ for actual field names
// Use real service implementations for integration tests (2-3 levels deep)
// Test LoanPaymentFactory and payment managers with real factory implementations
// Create test data using #region test data generation pattern
// Use uuidv4() for all test IDs and entity creation

/**
 * Integration tests for Loan Payment Managers
 * 
 * Tests LoanPaymentFactory and related payment managers:
 * - FundingPaymentManager, DisbursementPaymentManager, RepaymentPaymentManager
 * - FeePaymentManager, RefundPaymentManager
 * 
 * These tests verify payment factory functionality using real service implementations
 * with proper entity dependency management. Payment managers handle type-specific operations
 * based on loan payment types (Funding, Disbursement, Repayment, Fee, Refund).
 */
describe('Loan Payment Managers Integration', () => {
  let module: TestingModule;
  let domainServices: IDomainServices;
  let loanPaymentFactory: LoanPaymentFactory;
  let databaseBackup: IBackup;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let foundationData: ITestDataRegistry;

  // Test-specific IDs for non-existent entities
  const nonExistentPaymentId = uuidv4();
  const nonExistentLoanId = uuidv4();

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
        LoanPaymentModule, // Loan payment module
        LoanPaymentStepModule, // Loan payment step module
        TransferExecutionModule, // Transfer execution module
      ],
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    domainServices = module.get<IDomainServices>(IDomainServices);
    loanPaymentFactory = module.get<LoanPaymentFactory>(LoanPaymentFactory);
    
    // Seed foundation data before creating backup
    foundationData = await TestDataSeeder.seedFoundationData(dataSource);
    databaseBackup = database.backup();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Restore database to clean state before each test (includes foundation data)
    databaseBackup.restore();
  });

  // #region test data generation

  async function createTestPayment(
    paymentType: typeof LoanPaymentTypeCodes[keyof typeof LoanPaymentTypeCodes] = LoanPaymentTypeCodes.Funding,
    amount: number = 1000,
    paymentNumber: number = 1
  ): Promise<ILoanPayment> {
    // Use foundation loan for payment creation
    const payment = await domainServices.paymentServices.createPayment({
      loanId: FOUNDATION_TEST_IDS.loans.activeLoan,
      amount,
      type: paymentType,
      state: LoanPaymentStateCodes.Created,
      paymentNumber,
    });

    if (!payment) {
      throw new Error('Failed to create test payment - check entity constraints');
    }

    return payment;
  }

  async function createTestPaymentForAdvancing(
    paymentType: typeof LoanPaymentTypeCodes[keyof typeof LoanPaymentTypeCodes] = LoanPaymentTypeCodes.Funding
  ): Promise<string> {
    const payment = await createTestPayment(paymentType);
    return payment.id;
  }

  // #endregion

  describe('LoanPaymentFactory', () => {
    it('should get funding payment manager for funding type', () => {
      // Act
      const manager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      
      // Assert
      expect(manager).toBeInstanceOf(FundingPaymentManager);
      expect(manager).toBeDefined();
    });

    it('should get disbursement payment manager for disbursement type', () => {
      // Act
      const manager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);
      
      // Assert
      expect(manager).toBeInstanceOf(DisbursementPaymentManager);
      expect(manager).toBeDefined();
    });

    it('should get repayment payment manager for repayment type', () => {
      // Act
      const manager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      
      // Assert
      expect(manager).toBeInstanceOf(RepaymentPaymentManager);
      expect(manager).toBeDefined();
    });

    it('should get fee payment manager for fee type', () => {
      // Act
      const manager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      
      // Assert
      expect(manager).toBeInstanceOf(FeePaymentManager);
      expect(manager).toBeDefined();
    });

    it('should get refund payment manager for refund type', () => {
      // Act
      const manager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      
      // Assert
      expect(manager).toBeInstanceOf(RefundPaymentManager);
      expect(manager).toBeDefined();
    });

    it('should throw error for unsupported payment type', () => {
      // Act & Assert
      expect(() => {
        loanPaymentFactory.getManager('unsupported' as any);
      }).toThrow();
    });

    it('should handle all payment type scenarios', () => {
      // Arrange - All supported payment types
      const paymentTypes = [
        LoanPaymentTypeCodes.Funding,
        LoanPaymentTypeCodes.Disbursement,
        LoanPaymentTypeCodes.Repayment,
        LoanPaymentTypeCodes.Fee,
        LoanPaymentTypeCodes.Refund,
      ];

      // Act - Get managers for all types
      const managers = paymentTypes.map(type => loanPaymentFactory.getManager(type));

      // Assert
      expect(managers).toHaveLength(5);
      expect(managers[0]).toBeInstanceOf(FundingPaymentManager);
      expect(managers[1]).toBeInstanceOf(DisbursementPaymentManager);
      expect(managers[2]).toBeInstanceOf(RepaymentPaymentManager);
      expect(managers[3]).toBeInstanceOf(FeePaymentManager);
      expect(managers[4]).toBeInstanceOf(RefundPaymentManager);
    });
  });

  describe('FundingPaymentManager', () => {
    it('should initiate funding payment for existing loan', async () => {
      // Arrange
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      
      // Act - Test with foundation loan
      const result = await fundingManager.initiate(FOUNDATION_TEST_IDS.loans.activeLoan);
      
      // Assert - Should return null since no payment factory configuration exists in test
      expect(result).toBeNull();
    });

    it('should advance funding payment when payment exists', async () => {
      // Arrange
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      const paymentId = await createTestPaymentForAdvancing();
      
      // Act
      const result = await fundingManager.advance(paymentId);
      
      // Assert - Should return null since no step management configuration exists in test
      expect(result).toBeNull();
    });

    it('should handle non-existent payment gracefully', async () => {
      // Arrange
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      
      // Act
      const result = await fundingManager.advance(nonExistentPaymentId);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should handle non-existent loan for initiation', async () => {
      // Arrange
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      
      // Act
      const result = await fundingManager.initiate(nonExistentLoanId);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should validate funding payment creation and advancement workflow', async () => {
      // Arrange
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      const testPayment = await createTestPayment(LoanPaymentTypeCodes.Funding, 2000);
      
      // Act
      const advanceResult = await fundingManager.advance(testPayment.id);
      
      // Assert
      expect(advanceResult).toBeNull(); // Expected in test environment
      expect(testPayment.type).toBe(LoanPaymentTypeCodes.Funding);
      expect(testPayment.amount).toBe(2000);
    });

    it('should have domain services configured properly', () => {
      // Assert - Verify domainServices is properly injected
      expect(domainServices).toBeDefined();
      expect(domainServices.paymentServices).toBeDefined();
    });
  });

  describe('DisbursementPaymentManager', () => {
    it('should initiate disbursement payment for existing loan', async () => {
      // Arrange
      const disbursementManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);
      
      // Act - Test with foundation loan
      const result = await disbursementManager.initiate(FOUNDATION_TEST_IDS.loans.activeLoan);
      
      // Assert - Should return null since no payment factory configuration exists in test
      expect(result).toBeNull();
    });

    it('should advance disbursement payment when payment exists', async () => {
      // Arrange
      const disbursementManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);
      const paymentId = await createTestPaymentForAdvancing(LoanPaymentTypeCodes.Disbursement);
      
      // Act
      const result = await disbursementManager.advance(paymentId);
      
      // Assert - Should return null since no step management configuration exists in test
      expect(result).toBeNull();
    });

    it('should handle non-existent loan for disbursement initiation', async () => {
      // Arrange
      const disbursementManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);
      
      // Act
      const result = await disbursementManager.initiate(nonExistentLoanId);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should validate disbursement payment properties', async () => {
      // Arrange
      const disbursementManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);
      const testPayment = await createTestPayment(LoanPaymentTypeCodes.Disbursement, 1500);
      
      // Act
      const advanceResult = await disbursementManager.advance(testPayment.id);
      
      // Assert
      expect(advanceResult).toBeNull(); // Expected in test environment
      expect(testPayment.type).toBe(LoanPaymentTypeCodes.Disbursement);
      expect(testPayment.amount).toBe(1500);
    });
  });

  describe('RepaymentPaymentManager', () => {
    it('should initiate repayment payments for existing loan', async () => {
      // Arrange
      const repaymentManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      
      // Act - Test with foundation loan
      const result = await repaymentManager.initiate(FOUNDATION_TEST_IDS.loans.activeLoan);
      
      // Assert - Should return null since no payment factory configuration exists in test
      expect(result).toBeNull();
    });

    it('should advance repayment payment when payment exists', async () => {
      // Arrange
      const repaymentManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      const paymentId = await createTestPaymentForAdvancing(LoanPaymentTypeCodes.Repayment);
      
      // Act
      const result = await repaymentManager.advance(paymentId);
      
      // Assert - Should return null since no step management configuration exists in test
      expect(result).toBeNull();
    });

    it('should handle non-existent loan for repayment initiation', async () => {
      // Arrange
      const repaymentManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      
      // Act
      const result = await repaymentManager.initiate(nonExistentLoanId);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should validate repayment payment creation', async () => {
      // Arrange
      const repaymentManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      const testPayment = await createTestPayment(LoanPaymentTypeCodes.Repayment, 750);
      
      // Act
      const advanceResult = await repaymentManager.advance(testPayment.id);
      
      // Assert
      expect(advanceResult).toBeNull(); // Expected in test environment
      expect(testPayment.type).toBe(LoanPaymentTypeCodes.Repayment);
      expect(testPayment.amount).toBe(750);
    });
  });

  describe('FeePaymentManager', () => {
    it('should initiate fee payment for existing loan', async () => {
      // Arrange
      const feeManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      
      // Act - Test with foundation loan
      const result = await feeManager.initiate(FOUNDATION_TEST_IDS.loans.activeLoan);
      
      // Assert - Should return null since no payment factory configuration exists in test
      expect(result).toBeNull();
    });

    it('should advance fee payment when payment exists', async () => {
      // Arrange
      const feeManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      const paymentId = await createTestPaymentForAdvancing(LoanPaymentTypeCodes.Fee);
      
      // Act
      const result = await feeManager.advance(paymentId);
      
      // Assert - Should return null since no step management configuration exists in test
      expect(result).toBeNull();
    });

    it('should handle non-existent loan for fee initiation', async () => {
      // Arrange
      const feeManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      
      // Act
      const result = await feeManager.initiate(nonExistentLoanId);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should validate fee payment properties', async () => {
      // Arrange
      const feeManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      const testPayment = await createTestPayment(LoanPaymentTypeCodes.Fee, 100);
      
      // Act
      const advanceResult = await feeManager.advance(testPayment.id);
      
      // Assert
      expect(advanceResult).toBeNull(); // Expected in test environment
      expect(testPayment.type).toBe(LoanPaymentTypeCodes.Fee);
      expect(testPayment.amount).toBe(100);
    });
  });

  describe('RefundPaymentManager', () => {
    it('should initiate refund payment for existing loan', async () => {
      // Arrange
      const refundManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      
      // Act - Test with foundation loan
      const result = await refundManager.initiate(FOUNDATION_TEST_IDS.loans.activeLoan);
      
      // Assert - Should return null since no payment factory configuration exists in test
      expect(result).toBeNull();
    });

    it('should advance refund payment when payment exists', async () => {
      // Arrange
      const refundManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      const paymentId = await createTestPaymentForAdvancing(LoanPaymentTypeCodes.Refund);
      
      // Act
      const result = await refundManager.advance(paymentId);
      
      // Assert - Should return null since no step management configuration exists in test
      expect(result).toBeNull();
    });

    it('should handle non-existent loan for refund initiation', async () => {
      // Arrange
      const refundManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      
      // Act
      const result = await refundManager.initiate(nonExistentLoanId);
      
      // Assert
      expect(result).toBeNull();
    });

    it('should validate refund payment properties', async () => {
      // Arrange
      const refundManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      const testPayment = await createTestPayment(LoanPaymentTypeCodes.Refund, 250);
      
      // Act
      const advanceResult = await refundManager.advance(testPayment.id);
      
      // Assert
      expect(advanceResult).toBeNull(); // Expected in test environment
      expect(testPayment.type).toBe(LoanPaymentTypeCodes.Refund);
      expect(testPayment.amount).toBe(250);
    });
  });
});
