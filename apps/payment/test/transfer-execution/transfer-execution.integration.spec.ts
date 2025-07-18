import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import {
  LoanPaymentStateCodes,
  LoanPaymentTypeCodes,
  PaymentAccountProviderCodes,
  PaymentStepStateCodes,
  TransferStateCodes,
} from '@library/entity/enum';
import { EntityNotFoundException } from '@library/shared/common/exception/domain';
import { AllEntities, PaymentAccount, Transfer } from '@library/shared/domain/entity';
import { memoryDataSourceSingle } from '@library/shared/tests/postgress-memory-datasource';
import { FOUNDATION_TEST_IDS, TestDataSeeder } from '@library/shared/tests/test-data-seeder';
import { TestPaymentAccountFactory } from '@library/shared/tests/test-payment-account-factory';
import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '@payment/modules/data';
import { DomainModule } from '@payment/modules/domain/domain.module';
import { IDomainServices } from '@payment/modules/domain/idomain.services';
import {
  CheckbookTransferExecutionProvider,
  FiservTransferExecutionProvider,
  MockTransferExecutionProvider,
  TabapayTransferExecutionProvider,
} from '../../src/modules/transfer-execution/providers';
import { TransferExecutionFactory } from '../../src/modules/transfer-execution/transfer-execution.factory';
import { TransferExecutionModule } from '../../src/modules/transfer-execution/transfer-execution.module';

// Follow ZNG testing guidelines from .github/copilot/test-instructions.md
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
    
    // Seed foundation data BEFORE creating backup
    await TestDataSeeder.seedFoundationData(dataSource);
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

  async function createTestCheckbookAccount(): Promise<PaymentAccount> {
    const accountData = TestPaymentAccountFactory.createCheckbookBankAccount('Test Checkbook Account');
    const account = await domainServices.paymentServices.addPaymentAccount(
      FOUNDATION_TEST_IDS.users.primaryUser,
      accountData as any
    );

    if (!account) {
      throw new Error('Failed to create Checkbook test account - check entity constraints');
    }

    return account;
  }

  async function createTestFiservAccount(): Promise<PaymentAccount> {
    const accountData = TestPaymentAccountFactory.createFiservDebitAccount('Test Fiserv Account');
    const account = await domainServices.paymentServices.addPaymentAccount(
      FOUNDATION_TEST_IDS.users.primaryUser,
      accountData as any
    );

    if (!account) {
      throw new Error('Failed to create Fiserv test account - check entity constraints');
    }

    return account;
  }

  async function createTestTransfer(sourceAccount: PaymentAccount, destAccount: PaymentAccount): Promise<Transfer> {
    const payment = await domainServices.paymentServices.createPayment({
      loanId: FOUNDATION_TEST_IDS.loans.disbursedLoan,
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
    // TODO: Enable these tests when TransferExecutionFactory.getProviderByType() implementation is completed
    // Currently factory returns mock provider due to "TODO: Remove mock when Providers implemented" comment
    it.skip('should get Checkbook provider for Checkbook accounts when transfer exists', async () => {
      // Arrange
      const sourceAccount = await createTestCheckbookAccount();
      const destAccount = await createTestFiservAccount();
      const transfer = await createTestTransfer(sourceAccount, destAccount);
      
      // Act
      const provider = await transferExecutionFactory.getProvider(transfer.id, PaymentAccountProviderCodes.Checkbook);
      
      // Assert
      expect(provider).toBeInstanceOf(CheckbookTransferExecutionProvider);
    });

    // TODO: Enable these tests when TransferExecutionFactory.getProviderByType() implementation is completed
    // Currently factory returns mock provider due to "TODO: Remove mock when Providers implemented" comment
    it.skip('should get Fiserv provider for Fiserv accounts when transfer exists', async () => {
      // Arrange
      const sourceAccount = await createTestCheckbookAccount();
      const destAccount = await createTestFiservAccount();
      const transfer = await createTestTransfer(sourceAccount, destAccount);
      
      // Act
      const provider = await transferExecutionFactory.getProvider(transfer.id, PaymentAccountProviderCodes.Fiserv);
      
      // Assert
      expect(provider).toBeInstanceOf(FiservTransferExecutionProvider);
    });

    // TODO: Enable these tests when TransferExecutionFactory.getProviderByType() implementation is completed
    // Currently factory returns mock provider due to "TODO: Remove mock when Providers implemented" comment
    it.skip('should get Tabapay provider for Tabapay accounts when transfer exists', async () => {
      // Arrange
      const sourceAccount = await createTestCheckbookAccount();
      const destAccount = await createTestFiservAccount();
      const transfer = await createTestTransfer(sourceAccount, destAccount);
      
      // Act
      const provider = await transferExecutionFactory.getProvider(transfer.id, PaymentAccountProviderCodes.Tabapay);
      
      // Assert
      expect(provider).toBeInstanceOf(TabapayTransferExecutionProvider);
    });

    // Temporary tests for current behavior - remove when actual provider selection is implemented
    it('should temporarily return mock provider for Checkbook until implementation is completed', async () => {
      // Arrange
      const sourceAccount = await createTestCheckbookAccount();
      const destAccount = await createTestFiservAccount();
      const transfer = await createTestTransfer(sourceAccount, destAccount);
      
      // Act - Current implementation returns mock provider due to TODO in factory
      const provider = await transferExecutionFactory.getProvider(transfer.id, PaymentAccountProviderCodes.Checkbook);
      
      // Assert - Temporary behavior until getProviderByType() is implemented
      expect(provider).toBeInstanceOf(MockTransferExecutionProvider);
    });

    it('should temporarily return mock provider for Fiserv until implementation is completed', async () => {
      // Arrange
      const sourceAccount = await createTestCheckbookAccount();
      const destAccount = await createTestFiservAccount();
      const transfer = await createTestTransfer(sourceAccount, destAccount);
      
      // Act - Current implementation returns mock provider due to TODO in factory
      const provider = await transferExecutionFactory.getProvider(transfer.id, PaymentAccountProviderCodes.Fiserv);
      
      // Assert - Temporary behavior until getProviderByType() is implemented
      expect(provider).toBeInstanceOf(MockTransferExecutionProvider);
    });

    it('should temporarily return mock provider for Tabapay until implementation is completed', async () => {
      // Arrange
      const sourceAccount = await createTestCheckbookAccount();
      const destAccount = await createTestFiservAccount();
      const transfer = await createTestTransfer(sourceAccount, destAccount);
      
      // Act - Current implementation returns mock provider due to TODO in factory
      const provider = await transferExecutionFactory.getProvider(transfer.id, PaymentAccountProviderCodes.Tabapay);
      
      // Assert - Temporary behavior until getProviderByType() is implemented
      expect(provider).toBeInstanceOf(MockTransferExecutionProvider);
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

    it('should throw EntityNotFoundException when transfer does not exist', async () => {
      // Act & Assert - PaymentDomainService.getTransferById throws EntityNotFoundException for non-existent transfers
      await expect(
        transferExecutionFactory.getProvider(nonExistentTransferId)
      ).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('Transfer Execution Providers', () => {
    let testTransfer: Transfer;
    let sourceAccount: PaymentAccount;
    let destAccount: PaymentAccount;

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
        expect(updatedTransfer.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        // Act - Mock provider returns true regardless of transfer existence
        const result = await checkbookProvider.executeTransfer(nonExistentTransferId);
        
        // Assert - Provider executes without validation
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
        expect(updatedTransfer.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        // Act - Mock provider returns true regardless of transfer existence
        const result = await fiservProvider.executeTransfer(nonExistentTransferId);
        
        // Assert - Provider executes without validation
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
        expect(updatedTransfer.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        // Act - Mock provider returns true regardless of transfer existence
        const result = await mockProvider.executeTransfer(nonExistentTransferId);
        
        // Assert - Provider executes without validation
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
        expect(updatedTransfer.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        // Act - Mock provider returns true regardless of transfer existence
        const result = await tabapayProvider.executeTransfer(nonExistentTransferId);
        
        // Assert - Provider executes without validation
        expect(result).toBe(true);
      });
    });
  });

  describe('Transfer State Management', () => {
    let testTransfer: Transfer;

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
      expect(transfer.state).toBe(TransferStateCodes.Created);
      expect(transfer.amount).toBe(1000);
      expect(transfer.id).toBe(testTransfer.id);
    });

    it('should execute transfer through provider without changing state', async () => {
      // Act
      const result = await checkbookProvider.executeTransfer(testTransfer.id);
      
      // Assert
      expect(result).toBe(true);
      
      // Verify transfer state remains created since providers don't update state in this implementation
      const updatedTransfer = await domainServices.paymentServices.getTransferById(testTransfer.id);
      expect(updatedTransfer).toBeDefined();
      expect(updatedTransfer.state).toBe(TransferStateCodes.Created);
      expect(updatedTransfer.amount).toBe(1000);
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
      expect(finalTransfer.state).toBe(TransferStateCodes.Created);
      expect(finalTransfer.amount).toBe(1000);
    });
  });
});
