import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import {
  ILoanPayment,
} from '@library/entity/entity-interface';
import {
  LoanPaymentStateCodes,
  LoanPaymentTypeCodes,
} from '@library/entity/enum';
import { AllEntities } from '@library/shared/domain/entity';
import { FOUNDATION_TEST_IDS, ITestDataRegistry, memoryDataSourceSingle, TestDataSeeder } from '@library/shared/tests';
import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '@payment/modules/data';
import { DomainModule } from '@payment/modules/domain/domain.module';
import { IDomainServices } from '@payment/modules/domain/idomain.services';
import { LoanPaymentStepModule } from '../../src/modules/loan-payment-steps/loan-payment-step.module';
import { LoanPaymentFactory } from '../../src/modules/loan-payments/loan-payment.factory';
import { LoanPaymentModule } from '../../src/modules/loan-payments/loan-payment.module';
import {
  DisbursementPaymentManager,
  FeePaymentManager,
  FundingPaymentManager,
  RefundPaymentManager,
  RepaymentPaymentManager,
} from '../../src/modules/loan-payments/managers';
import { TransferExecutionModule } from '../../src/modules/transfer-execution/transfer-execution.module';

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

  /**
   * Creates a test loan payment with specified type and amount
   * @param paymentType - Type of payment to create
   * @param amount - Payment amount (default: 1000)
   * @param paymentNumber - Payment number for repayments (default: 1)
   * @returns Promise resolving to the created loan payment
   * @throws Error if payment creation fails due to constraint violations
   */
  async function createTestPayment(
    paymentType: typeof LoanPaymentTypeCodes[keyof typeof LoanPaymentTypeCodes] = LoanPaymentTypeCodes.Funding,
    amount: number = 1000,
    paymentNumber: number = 1
  ): Promise<ILoanPayment> {
    // Use foundation loan for payment creation
    const payment = await domainServices.paymentServices.createPayment({
      loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
      amount,
      type: paymentType,
      state: LoanPaymentStateCodes.Created,
      paymentNumber,
      scheduledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (!payment) {
      throw new Error('Failed to create test payment - check entity constraints');
    }

    return payment;
  }

  /**
   * Creates a test loan payment specifically for advancing tests
   * @param paymentType - Type of payment to create
   * @returns Promise resolving to the payment ID
   */
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
      const result = await fundingManager.initiate(FOUNDATION_TEST_IDS.loans.disbursedLoan);
      
      // Assert - Should return null since payment accounts are not configured in foundation data
      expect(result).toBeNull();
    });

    it('should advance funding payment when payment exists', async () => {
      // Arrange
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      const paymentId = await createTestPaymentForAdvancing();
      
      // Act
      const result = await fundingManager.advance(paymentId);
      
      // Assert - Should return true since no steps exist, payment is considered completed
      expect(result).toBe(true);
    });

    it('should handle non-existent payment gracefully', async () => {
      // Arrange
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      
      // Act & Assert - Should throw EntityNotFoundException for non-existent payment
      await expect(fundingManager.advance(nonExistentPaymentId)).rejects.toThrow();
    });

    it('should handle non-existent loan for initiation', async () => {
      // Arrange
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      
      // Act & Assert - Should throw EntityNotFoundException for non-existent loan
      await expect(fundingManager.initiate(nonExistentLoanId)).rejects.toThrow();
    });

    it('should validate funding payment creation workflow', async () => {
      // Arrange
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      const testPayment = await createTestPayment(LoanPaymentTypeCodes.Funding, 2000);
      
      // Act
      const advanceResult = await fundingManager.advance(testPayment.id);
      
      // Assert - Should return true since no steps exist, payment is considered completed
      expect(advanceResult).toBe(true);
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
      const result = await disbursementManager.initiate(FOUNDATION_TEST_IDS.loans.disbursedLoan);
      
      // Assert - Should return null since payment accounts are not configured in foundation data
      expect(result).toBeNull();
    });

    it('should advance disbursement payment when payment exists', async () => {
      // Arrange
      const disbursementManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);
      const paymentId = await createTestPaymentForAdvancing(LoanPaymentTypeCodes.Disbursement);
      
      // Act
      const result = await disbursementManager.advance(paymentId);
      
      // Assert - Should return true since no steps exist, payment is considered completed
      expect(result).toBe(true);
    });

    it('should handle non-existent loan for disbursement initiation', async () => {
      // Arrange
      const disbursementManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);
      
      // Act & Assert - Should throw EntityNotFoundException for non-existent loan
      await expect(disbursementManager.initiate(nonExistentLoanId)).rejects.toThrow();
    });

    it('should validate disbursement payment properties', async () => {
      // Arrange
      const disbursementManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);
      const testPayment = await createTestPayment(LoanPaymentTypeCodes.Disbursement, 1500);
      
      // Act
      const advanceResult = await disbursementManager.advance(testPayment.id);
      
      // Assert - Should return true since no steps exist, payment is considered completed
      expect(advanceResult).toBe(true);
      expect(testPayment.type).toBe(LoanPaymentTypeCodes.Disbursement);
      expect(testPayment.amount).toBe(1500);
    });
  });

  describe('RepaymentPaymentManager', () => {
    it('should initiate repayment payments for existing loan', async () => {
      // Arrange
      const repaymentManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      
      // Act - Test with foundation loan
      const result = await repaymentManager.initiate(FOUNDATION_TEST_IDS.loans.disbursedLoan);
      
      // Assert - Should return null since payment accounts are not configured in foundation data
      expect(result).toBeNull();
    });

    it('should advance repayment payment when payment exists', async () => {
      // Arrange
      const repaymentManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      const paymentId = await createTestPaymentForAdvancing(LoanPaymentTypeCodes.Repayment);
      
      // Act
      const result = await repaymentManager.advance(paymentId);
      
      // Assert - Should return true since no steps exist, payment is considered completed
      expect(result).toBe(true);
    });

    it('should handle non-existent loan for repayment initiation', async () => {
      // Arrange
      const repaymentManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      
      // Act & Assert - Should throw EntityNotFoundException for non-existent loan
      await expect(repaymentManager.initiate(nonExistentLoanId)).rejects.toThrow();
    });

    it('should validate repayment payment creation', async () => {
      // Arrange
      const repaymentManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      const testPayment = await createTestPayment(LoanPaymentTypeCodes.Repayment, 750);
      
      // Act
      const advanceResult = await repaymentManager.advance(testPayment.id);
      
      // Assert - Should return true since no steps exist, payment is considered completed
      expect(advanceResult).toBe(true);
      expect(testPayment.type).toBe(LoanPaymentTypeCodes.Repayment);
      expect(testPayment.amount).toBe(750);
    });
  });

  describe('FeePaymentManager', () => {
    it('should initiate fee payment for existing loan', async () => {
      // Arrange
      const feeManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      
      // Act - Test with foundation loan
      const result = await feeManager.initiate(FOUNDATION_TEST_IDS.loans.disbursedLoan);
      
      // Assert - Should return null since payment accounts are not configured in foundation data
      expect(result).toBeNull();
    });

    it('should advance fee payment when payment exists', async () => {
      // Arrange
      const feeManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      const paymentId = await createTestPaymentForAdvancing(LoanPaymentTypeCodes.Fee);
      
      // Act
      const result = await feeManager.advance(paymentId);
      
      // Assert - Should return true since no steps exist, payment is considered completed
      expect(result).toBe(true);
    });

    it('should handle non-existent loan for fee initiation', async () => {
      // Arrange
      const feeManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      
      // Act & Assert - Should throw EntityNotFoundException for non-existent loan
      await expect(feeManager.initiate(nonExistentLoanId)).rejects.toThrow();
    });

    it('should validate fee payment properties', async () => {
      // Arrange
      const feeManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      const testPayment = await createTestPayment(LoanPaymentTypeCodes.Fee, 100);
      
      // Act
      const advanceResult = await feeManager.advance(testPayment.id);
      
      // Assert - Should return true since no steps exist, payment is considered completed
      expect(advanceResult).toBe(true);
      expect(testPayment.type).toBe(LoanPaymentTypeCodes.Fee);
      expect(testPayment.amount).toBe(100);
    });
  });

  describe('RefundPaymentManager', () => {
    it('should initiate refund payment for existing loan', async () => {
      // Arrange
      const refundManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      
      // Act - Test with foundation loan
      const result = await refundManager.initiate(FOUNDATION_TEST_IDS.loans.disbursedLoan);
      
      // Assert - Should return null since payment accounts are not configured in foundation data
      expect(result).toBeNull();
    });

    it('should advance refund payment when payment exists', async () => {
      // Arrange
      const refundManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      const paymentId = await createTestPaymentForAdvancing(LoanPaymentTypeCodes.Refund);
      
      // Act
      const result = await refundManager.advance(paymentId);
      
      // Assert - Should return true since no steps exist, payment is considered completed
      expect(result).toBe(true);
    });

    it('should handle non-existent loan for refund initiation', async () => {
      // Arrange
      const refundManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      
      // Act & Assert - Should throw EntityNotFoundException for non-existent loan
      await expect(refundManager.initiate(nonExistentLoanId)).rejects.toThrow();
    });

    it('should validate refund payment properties', async () => {
      // Arrange
      const refundManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      const testPayment = await createTestPayment(LoanPaymentTypeCodes.Refund, 250);
      
      // Act
      const advanceResult = await refundManager.advance(testPayment.id);
      
      // Assert - Should return true since no steps exist, payment is considered completed
      expect(advanceResult).toBe(true);
      expect(testPayment.type).toBe(LoanPaymentTypeCodes.Refund);
      expect(testPayment.amount).toBe(250);
    });
  });

  describe('Payment Manager Integration', () => {
    it('should handle payment type validation correctly', () => {
      // Arrange - Test all valid payment types
      const validTypes = [
        LoanPaymentTypeCodes.Funding,
        LoanPaymentTypeCodes.Disbursement,
        LoanPaymentTypeCodes.Repayment,
        LoanPaymentTypeCodes.Fee,
        LoanPaymentTypeCodes.Refund,
      ];

      // Act & Assert - All valid types should return managers
      validTypes.forEach(type => {
        const manager = loanPaymentFactory.getManager(type);
        expect(manager).toBeDefined();
        expect(manager.initiate).toBeDefined();
        expect(manager.advance).toBeDefined();
      });
    });

    it('should handle payment creation for different amounts', async () => {
      // Arrange & Act - Create payments with different amounts
      const amounts = [100, 1000, 5000, 10000];
      const payments = await Promise.all(
        amounts.map(amount => createTestPayment(LoanPaymentTypeCodes.Funding, amount))
      );

      // Assert - All payments should be created with correct amounts
      payments.forEach((payment, index) => {
        expect(payment.amount).toBe(amounts[index]);
        expect(payment.type).toBe(LoanPaymentTypeCodes.Funding);
        expect(payment.state).toBe(LoanPaymentStateCodes.Created);
      });
    });

    it('should handle concurrent payment manager operations', async () => {
      // Arrange - Create multiple payments concurrently
      const paymentPromises = [
        createTestPayment(LoanPaymentTypeCodes.Funding, 1000),
        createTestPayment(LoanPaymentTypeCodes.Disbursement, 2000),
        createTestPayment(LoanPaymentTypeCodes.Repayment, 500),
      ];

      // Act
      const payments = await Promise.all(paymentPromises);

      // Assert - All payments should be created successfully
      expect(payments).toHaveLength(3);
      expect(payments[0].type).toBe(LoanPaymentTypeCodes.Funding);
      expect(payments[1].type).toBe(LoanPaymentTypeCodes.Disbursement);
      expect(payments[2].type).toBe(LoanPaymentTypeCodes.Repayment);
    });

    it('should validate manager advance operations with different payment states', async () => {
      // Arrange - Create payments and get managers
      const fundingPayment = await createTestPayment(LoanPaymentTypeCodes.Funding);
      const disbursementPayment = await createTestPayment(LoanPaymentTypeCodes.Disbursement);
      
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      const disbursementManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);

      // Act - Advance payments
      const fundingResult = await fundingManager.advance(fundingPayment.id);
      const disbursementResult = await disbursementManager.advance(disbursementPayment.id);

      // Assert - Both should return true since no steps exist, payments are considered completed
      expect(fundingResult).toBe(true);
      expect(disbursementResult).toBe(true);
    });

    it('should handle edge cases for payment creation', async () => {
      // Arrange & Act - Test edge cases
      const zeroAmountPayment = await createTestPayment(LoanPaymentTypeCodes.Fee, 0);
      const highAmountPayment = await createTestPayment(LoanPaymentTypeCodes.Funding, 999999);

      // Assert
      expect(zeroAmountPayment.amount).toBe(0);
      expect(zeroAmountPayment.type).toBe(LoanPaymentTypeCodes.Fee);
      expect(highAmountPayment.amount).toBe(999999);
      expect(highAmountPayment.type).toBe(LoanPaymentTypeCodes.Funding);
    });

    it('should maintain data integrity across manager operations', async () => {
      // Arrange - Create payment and get manager
      const testPayment = await createTestPayment(LoanPaymentTypeCodes.Repayment, 1500);
      const repaymentManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);

      // Act - Perform operations
      const advanceResult = await repaymentManager.advance(testPayment.id);

      // Assert - Verify data integrity
      expect(advanceResult).toBe(true); // No steps exist, payment is considered completed
      
      // Verify payment still exists and has correct properties
      const retrievedPayment = await domainServices.paymentServices.getLoanPaymentById(testPayment.id);
      expect(retrievedPayment).toBeDefined();
      expect(retrievedPayment!.id).toBe(testPayment.id);
      expect(retrievedPayment!.amount).toBe(1500);
      expect(retrievedPayment!.type).toBe(LoanPaymentTypeCodes.Repayment);
    });
  });
});
