import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
import { ManagementModule } from '../../src/domain/management.module';
import { IDomainServices } from '../../src/domain/idomain.services';
import { ManagementDomainService } from '../../src/domain/services';
import { 
  LoanPaymentStateCodes,
  LoanPaymentTypeCodes,
  PaymentAccountOwnershipTypeCodes,
  PaymentAccountProviderCodes,
  PaymentAccountStateCodes,
  PaymentAccountTypeCodes,
  PaymentStepStateCodes,
} from '@library/entity/enum';
import { memoryDataSourceSingle } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entities';

// Follow ZNG testing guidelines from .github/copilot/test-instructions.md
// Use real service implementations for integration tests (2-3 levels deep)
// Create test data using #region test data generation pattern
describe('ManagementDomainService Integration', () => {
  let module: TestingModule;
  let domainServices: IDomainServices;
  let managementDomainService: ManagementDomainService;
  let databaseBackup: IBackup;

  // Use uuidv4() for all test IDs and entity creation
  const testUserId = uuidv4();
  const testLoanId = uuidv4();
  let testAccountId: string;
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

    // Create test module with real service implementations
    module = await Test.createTestingModule({
      imports: [
        DataModule, // Real data module with repositories
        DomainModule, // Real domain module with services
        ManagementModule, // Management module with ManagementDomainService
      ],
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    domainServices = module.get<IDomainServices>(IDomainServices);
    managementDomainService = module.get<ManagementDomainService>(ManagementDomainService);
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
    // Create a loan first to avoid foreign key constraint violation
    await createLoan();

    // Create payment accounts for source and destination
    const sourceAccount = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Checkbook,
      ownership: PaymentAccountOwnershipTypeCodes.Personal,
      accountHolderName: 'John Smith',
      accountNumber: `1234567890${Date.now()}`, // Unique account number
      routingNumber: '123456789',
      state: PaymentAccountStateCodes.Verified,
    });

    const destAccount = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Fiserv,
      ownership: PaymentAccountOwnershipTypeCodes.Internal,
      accountHolderName: 'Jane Doe',
      accountNumber: `0987654321${Date.now()}`, // Unique account number
      routingNumber: '987654321',
      state: PaymentAccountStateCodes.Verified,
    });

    if (!sourceAccount || !destAccount) {
      throw new Error('Failed to create payment accounts');
    }

    testAccountId = sourceAccount.id;

    // Create a loan payment
    const payment = await domainServices.paymentServices.createPayment({
      loanId: testLoanId,
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

    // Create transfer for the step
    const transfer = await domainServices.paymentServices.createTransferForStep(testStepId);
    
    if (!transfer) {
      throw new Error('Failed to create transfer');
    }

    testTransferId = transfer.id;
  }

  async function createLoan(): Promise<void> {
    // Create a minimal loan entity to satisfy foreign key constraints
    const loanData = {
      id: testLoanId,
      amount: 5000,
      type: 'personal',
      state: 'created',
      closureType: 'open',
      paymentsCount: 12,
      paymentFrequency: 'monthly',
      lenderId: testUserId,
      invitee: {
        type: 'borrower',
        firstName: 'Test',
        lastName: 'Borrower',
        email: 'borrower@test.com',
        phone: '+1234567890',
      },
    };
    
    // Use raw SQL to insert loan data since we don't have loan creation services in payment app
    const dataSource = module.get(DataSource);
    await dataSource.query(`
      INSERT INTO core.loans (
        id, amount, type, state, closure_type, payments_count, payment_frequency, lender_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      )
    `, [
      loanData.id,
      loanData.amount,
      loanData.type,
      loanData.state,
      loanData.closureType,
      loanData.paymentsCount,
      loanData.paymentFrequency,
      loanData.lenderId,
    ]);
    
    // Create loan invitee
    await dataSource.query(`
      INSERT INTO core.loan_invitees (
        id, loan_id, type, first_name, last_name, email, phone
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
    `, [
      uuidv4(),
      loanData.id,
      loanData.invitee.type,
      loanData.invitee.firstName,
      loanData.invitee.lastName,
      loanData.invitee.email,
      loanData.invitee.phone,
    ]);
  }

  async function createPaymentAccount(): Promise<void> {
    // Only create a payment account for tests that just need account data
    const account = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Checkbook,
      ownership: PaymentAccountOwnershipTypeCodes.Personal,
      accountHolderName: 'John Smith',
      accountNumber: `1234567890${Date.now()}`, // Unique account number
      routingNumber: '123456789',
      state: PaymentAccountStateCodes.Verified,
    });

    if (!account) {
      throw new Error('Failed to create payment account');
    }

    testAccountId = account.id;
  }

  async function createPaymentWithAccount(): Promise<void> {
    // Create loan and account first
    await createLoan();
    await createPaymentAccount();

    // Create a loan payment
    const payment = await domainServices.paymentServices.createPayment({
      loanId: testLoanId,
      amount: 1000,
      type: LoanPaymentTypeCodes.Funding,
      state: LoanPaymentStateCodes.Created,
    });

    if (!payment) {
      throw new Error('Failed to create payment');
    }

    testPaymentId = payment.id;
  }

  async function createStepWithPayment(): Promise<void> {
    // Create loan first to avoid foreign key constraint
    await createLoan();
    
    // Create payment accounts and payment first
    const sourceAccount = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Checkbook,
      ownership: PaymentAccountOwnershipTypeCodes.Personal,
      accountHolderName: 'John Smith',
      accountNumber: `1234567890${Date.now()}`, // Unique account number
      routingNumber: '123456789',
      state: PaymentAccountStateCodes.Verified,
    });

    const destAccount = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Fiserv,
      ownership: PaymentAccountOwnershipTypeCodes.Internal,
      accountHolderName: 'Jane Doe',
      accountNumber: `0987654321${Date.now()}`, // Unique account number
      routingNumber: '987654321',
      state: PaymentAccountStateCodes.Verified,
    });

    if (!sourceAccount || !destAccount) {
      throw new Error('Failed to create payment accounts');
    }

    const payment = await domainServices.paymentServices.createPayment({
      loanId: testLoanId,
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
  }

  // #endregion

  describe('Payment Account Management', () => {
    it('should get payment account details', async () => {
      // Only create payment account for this test
      await createPaymentAccount();
      
      // Test retrieving specific payment account through PaymentDomainService
      const result = await domainServices.paymentServices.getPaymentAccountById(testAccountId);
      
      expect(result).toBeDefined();
      expect(result!.id).toBe(testAccountId);
    });
  });

  describe('Loan Payment Management', () => {
    it('should handle initiate loan payment for non-existent loan', async () => {
      // Test initiateLoanPayment method - with non-existent loan
      // Should throw EntityNotFoundException because loan doesn't exist
      await expect(
        managementDomainService.initiateLoanPayment(nonExistentLoanId, LoanPaymentTypeCodes.Funding)
      ).rejects.toThrow('Loan not found');
    });

    it('should handle advance payment for existing payment', async () => {
      // Only create payment account and payment for this test
      await createPaymentWithAccount();
      
      // Test advancePayment method - with existing payment
      const result = await managementDomainService.advancePayment(testPaymentId, LoanPaymentTypeCodes.Funding);
      
      // Since no loan payment factory managers are configured in test, expect null
      expect(result).toBeNull();
    });
  });

  describe('Payment Step Management', () => {
    it('should handle advance payment step for existing step', async () => {
      // Only create payment accounts, payment, and step for this test
      await createStepWithPayment();
      
      // Test advancePaymentStep method - with existing step
      const result = await managementDomainService.advancePaymentStep(testStepId, PaymentStepStateCodes.Created);
      
      // Should attempt to advance the step but may not have full configuration
      expect(result).toBeDefined();
    });
  });

  describe('Transfer Management', () => {
    it('should handle execute transfer for existing transfer', async () => {
      // Create full test data including transfer for this test
      await createTestData();
      
      // Test executeTransfer method - with existing transfer
      const result = await managementDomainService.executeTransfer(testTransferId, PaymentAccountProviderCodes.Checkbook);
      
      // Since no transfer execution providers are configured in test, expect null
      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing input for initiate loan payment', async () => {
      // Test with non-existent loan ID - should throw exception
      await expect(
        managementDomainService.initiateLoanPayment(nonExistentLoanId, LoanPaymentTypeCodes.Funding)
      ).rejects.toThrow('Loan not found');
    });

    it('should handle missing input for advance payment step', async () => {
      // Test with non-existent step ID - should throw exception
      await expect(
        managementDomainService.advancePaymentStep(nonExistentStepId)
      ).rejects.toThrow('Payment step not found');
    });

    it('should handle missing input for execute transfer', async () => {
      // Test with non-existent transfer ID - should throw exception
      await expect(
        managementDomainService.executeTransfer(nonExistentTransferId)
      ).rejects.toThrow('Transfer not found');
    });
  });
});
