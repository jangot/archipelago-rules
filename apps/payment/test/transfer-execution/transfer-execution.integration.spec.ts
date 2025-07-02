import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
import { TransferExecutionModule } from '../../src/transfer-execution/transfer-execution.module';
import { IDomainServices } from '../../src/domain/idomain.services';
import { TransferExecutionFactory } from '../../src/transfer-execution/transfer-execution.factory';
import { 
  CheckbookTransferExecutionProvider, 
  FiservTransferExecutionProvider, 
  MockTransferExecutionProvider, 
  TabapayTransferExecutionProvider, 
} from '../../src/transfer-execution/providers';
import { 
  ITransfer,
  IPaymentAccount,
} from '@library/entity/entity-interface';
import { 
  PaymentAccountProviderCodes,
  PaymentAccountTypeCodes,
  PaymentAccountOwnershipTypeCodes,
  PaymentAccountStateCodes,
  TransferStateCodes,
  PaymentStepStateCodes,
  LoanPaymentStateCodes,
  LoanPaymentTypeCodes,
} from '@library/entity/enum';
import { memoryDataSourceSingle } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entity';

// Follow ZNG testing guidelines from .github/copilot/test-instructions.md
// Verify entity interfaces first - check libs/entity/src/interface/ for actual field names
// Use real service implementations for integration tests (2-3 levels deep)
// Test TransferExecutionFactory and execution providers with real implementations
// Create test data using #region test data generation pattern
// Use uuidv4() for all test IDs and entity creation

/**
 * Integration tests for Transfer Execution
 * 
 * Tests TransferExecutionFactory and related execution providers:
 * - CheckbookTransferExecutionProvider, FiservTransferExecutionProvider
 * - MockTransferExecutionProvider, TabapayTransferExecutionProvider
 * 
 * These tests verify transfer execution functionality using real service implementations
 * with proper entity state management. Transfer providers handle payment-specific execution
 * based on provider types (Checkbook, Fiserv, Tabapay, Mock).
 */
describe('Transfer Execution Integration', () => {
  let module: TestingModule;
  let domainServices: IDomainServices;
  let transferExecutionFactory: TransferExecutionFactory;
  let checkbookProvider: CheckbookTransferExecutionProvider;
  let fiservProvider: FiservTransferExecutionProvider;
  let mockProvider: MockTransferExecutionProvider;
  let tabapayProvider: TabapayTransferExecutionProvider;
  let databaseBackup: IBackup;

  // Use uuidv4() for all test IDs and entity creation
  const testUserId = uuidv4();
  const testLoanId = uuidv4();
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
        TransferExecutionModule, // Transfer execution module
      ],
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    domainServices = module.get<IDomainServices>(IDomainServices);
    transferExecutionFactory = module.get<TransferExecutionFactory>(TransferExecutionFactory);
    checkbookProvider = module.get<CheckbookTransferExecutionProvider>(CheckbookTransferExecutionProvider);
    fiservProvider = module.get<FiservTransferExecutionProvider>(FiservTransferExecutionProvider);
    mockProvider = module.get<MockTransferExecutionProvider>(MockTransferExecutionProvider);
    tabapayProvider = module.get<TabapayTransferExecutionProvider>(TabapayTransferExecutionProvider);
    
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
    
    // Create loan invitee
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

  async function createTestCheckbookAccount(): Promise<IPaymentAccount> {
    const account = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      ownership: PaymentAccountOwnershipTypeCodes.Personal,
      provider: PaymentAccountProviderCodes.Checkbook,
      state: PaymentAccountStateCodes.Verified,
      details: {
        type: 'checkbook_ach',
        displayName: 'John Doe',
        key: 'checkbook_key_123',
        secret: 'checkbook_secret_456',
        accountId: `checkbook_acc_${Date.now()}`,
        institution: 'Checkbook Bank',
        redactedAccountNumber: '****7890',
        routingNumber: '123456789',
      },
      isDefault: true,
      isActive: true,
    });

    if (!account) {
      throw new Error('Failed to create Checkbook test account - check entity constraints');
    }

    return account;
  }

  async function createTestFiservAccount(): Promise<IPaymentAccount> {
    const account = await domainServices.paymentServices.addPaymentAccount(testUserId, {
      type: PaymentAccountTypeCodes.BankAccount,
      ownership: PaymentAccountOwnershipTypeCodes.Internal,
      provider: PaymentAccountProviderCodes.Fiserv,
      state: PaymentAccountStateCodes.Verified,
      details: {
        type: 'fiserv_debit',
        displayName: 'Zirtue Platform',
        cardToken: `fiserv_token_${Date.now()}`,
        cardExpiration: '12/30',
        last4Digits: '9876',
      },
      isDefault: true,
      isActive: true,
    });

    if (!account) {
      throw new Error('Failed to create Fiserv test account - check entity constraints');
    }

    return account;
  }

  async function createTestTransfer(sourceAccount: IPaymentAccount, destAccount: IPaymentAccount): Promise<ITransfer> {
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

    const steps = await domainServices.paymentServices.createPaymentSteps([{
      loanPaymentId: payment.id,
      order: 0,
      amount: 1000,
      sourcePaymentAccountId: sourceAccount.id,
      targetPaymentAccountId: destAccount.id,
      state: PaymentStepStateCodes.Created,
    }]);

    if (!steps || steps.length === 0) {
      throw new Error('Failed to create test payment steps - check entity constraints');
    }

    const transfer = await domainServices.paymentServices.createTransferForStep(steps[0].id);

    if (!transfer) {
      throw new Error('Failed to create test transfer - check entity constraints');
    }

    return transfer;
  }

  // #endregion

  describe('TransferExecutionFactory', () => {
    it('should get Checkbook provider for Checkbook accounts when transfer exists', async () => {
      // Arrange
      const sourceAccount = await createTestCheckbookAccount();
      const destAccount = await createTestFiservAccount();
      const transfer = await createTestTransfer(sourceAccount, destAccount);
      
      // Act
      const provider = await transferExecutionFactory.getProvider(transfer.id, PaymentAccountProviderCodes.Checkbook);
      
      // Assert
      expect(provider).toBeInstanceOf(CheckbookTransferExecutionProvider);
    });

    it('should get Fiserv provider for Fiserv accounts when transfer exists', async () => {
      // Arrange
      const sourceAccount = await createTestCheckbookAccount();
      const destAccount = await createTestFiservAccount();
      const transfer = await createTestTransfer(sourceAccount, destAccount);
      
      // Act
      const provider = await transferExecutionFactory.getProvider(transfer.id, PaymentAccountProviderCodes.Fiserv);
      
      // Assert
      expect(provider).toBeInstanceOf(FiservTransferExecutionProvider);
    });

    it('should get Tabapay provider for Tabapay accounts when transfer exists', async () => {
      // Arrange
      const sourceAccount = await createTestCheckbookAccount();
      const destAccount = await createTestFiservAccount();
      const transfer = await createTestTransfer(sourceAccount, destAccount);
      
      // Act
      const provider = await transferExecutionFactory.getProvider(transfer.id, PaymentAccountProviderCodes.Tabapay);
      
      // Assert
      expect(provider).toBeInstanceOf(TabapayTransferExecutionProvider);
    });

    it('should handle unsupported provider by returning mock provider', async () => {
      // Arrange
      const sourceAccount = await createTestCheckbookAccount();
      const destAccount = await createTestFiservAccount();
      const transfer = await createTestTransfer(sourceAccount, destAccount);
      
      // Act - Factory currently returns mock provider for any request without specific provider
      const provider = await transferExecutionFactory.getProvider(transfer.id);
      
      // Assert
      expect(provider).toBeInstanceOf(MockTransferExecutionProvider);
    });
  });

  describe('Transfer Execution Providers', () => {
    let testTransfer: ITransfer;
    let sourceAccount: IPaymentAccount;
    let destAccount: IPaymentAccount;

    beforeEach(async () => {
      // Arrange - Create test data for each test
      sourceAccount = await createTestCheckbookAccount();
      destAccount = await createTestFiservAccount();
      testTransfer = await createTestTransfer(sourceAccount, destAccount);
    });

    describe('CheckbookTransferExecutionProvider', () => {
      it('should execute transfer successfully when transfer exists', async () => {
        // Act
        const result = await checkbookProvider.executeTransfer(testTransfer.id);
        
        // Assert
        expect(result).toBe(true);
        
        // Verify transfer still exists with created state since providers don't update state
        const updatedTransfer = await domainServices.paymentServices.getTransferById(testTransfer.id);
        expect(updatedTransfer!.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        // Act
        const result = await checkbookProvider.executeTransfer(nonExistentTransferId);
        
        // Assert - Mock provider returns true regardless
        expect(result).toBe(true);
      });
    });

    describe('FiservTransferExecutionProvider', () => {
      it('should execute transfer successfully when transfer exists', async () => {
        // Act
        const result = await fiservProvider.executeTransfer(testTransfer.id);
        
        // Assert
        expect(result).toBe(true);
        
        // Verify transfer still exists with created state since providers don't update state
        const updatedTransfer = await domainServices.paymentServices.getTransferById(testTransfer.id);
        expect(updatedTransfer!.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        // Act
        const result = await fiservProvider.executeTransfer(nonExistentTransferId);
        
        // Assert - Mock provider returns true regardless
        expect(result).toBe(true);
      });
    });

    describe('MockTransferExecutionProvider', () => {
      it('should execute transfer successfully when transfer exists', async () => {
        // Act
        const result = await mockProvider.executeTransfer(testTransfer.id);
        
        // Assert
        expect(result).toBe(true);
        
        // Verify transfer still exists with created state since providers don't update state
        const updatedTransfer = await domainServices.paymentServices.getTransferById(testTransfer.id);
        expect(updatedTransfer!.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        // Act
        const result = await mockProvider.executeTransfer(nonExistentTransferId);
        
        // Assert - Mock provider returns true regardless
        expect(result).toBe(true);
      });
    });

    describe('TabapayTransferExecutionProvider', () => {
      it('should execute transfer successfully when transfer exists', async () => {
        // Act
        const result = await tabapayProvider.executeTransfer(testTransfer.id);
        
        // Assert
        expect(result).toBe(true);
        
        // Verify transfer still exists with created state since providers don't update state
        const updatedTransfer = await domainServices.paymentServices.getTransferById(testTransfer.id);
        expect(updatedTransfer!.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        // Act
        const result = await tabapayProvider.executeTransfer(nonExistentTransferId);
        
        // Assert - Mock provider returns true regardless
        expect(result).toBe(true);
      });
    });
  });

  describe('Transfer State Management', () => {
    let testTransfer: ITransfer;

    beforeEach(async () => {
      // Arrange - Create test data for transfer state tests
      const sourceAccount = await createTestCheckbookAccount();
      const destAccount = await createTestFiservAccount();
      testTransfer = await createTestTransfer(sourceAccount, destAccount);
    });

    it('should create transfer with initial state and proper amount', async () => {
      // Act
      const transfer = await domainServices.paymentServices.getTransferById(testTransfer.id);
      
      // Assert
      expect(transfer).toBeDefined();
      expect(transfer!.state).toBe(TransferStateCodes.Created);
      expect(transfer!.amount).toBe(1000);
      expect(transfer!.id).toBe(testTransfer.id);
    });

    it('should execute transfer through provider without changing state', async () => {
      // Act
      const result = await checkbookProvider.executeTransfer(testTransfer.id);
      
      // Assert
      expect(result).toBe(true);
      
      // Verify transfer state remains created since providers don't update state in this implementation
      const updatedTransfer = await domainServices.paymentServices.getTransferById(testTransfer.id);
      expect(updatedTransfer).toBeDefined();
      expect(updatedTransfer!.state).toBe(TransferStateCodes.Created);
      expect(updatedTransfer!.amount).toBe(1000);
    });

    it('should maintain transfer consistency across multiple provider executions', async () => {
      // Act - Execute with multiple providers
      const checkbookResult = await checkbookProvider.executeTransfer(testTransfer.id);
      const fiservResult = await fiservProvider.executeTransfer(testTransfer.id);
      const mockResult = await mockProvider.executeTransfer(testTransfer.id);
      
      // Assert
      expect(checkbookResult).toBe(true);
      expect(fiservResult).toBe(true);
      expect(mockResult).toBe(true);
      
      // Verify transfer remains consistent
      const finalTransfer = await domainServices.paymentServices.getTransferById(testTransfer.id);
      expect(finalTransfer).toBeDefined();
      expect(finalTransfer!.state).toBe(TransferStateCodes.Created);
      expect(finalTransfer!.amount).toBe(1000);
    });
  });
});
