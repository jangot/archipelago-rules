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
} from '@library/entity/interface';
import { 
  PaymentAccountProviderCodes,
  PaymentAccountTypeCodes,
  PaymentAccountOwnershipTypeCodes,
  TransferStateCodes,
  PaymentStepStateCodes,
  LoanPaymentStateCodes,
  LoanPaymentTypeCodes,
} from '@library/entity/enum';
import { DeepPartial } from 'typeorm';
import { memoryDataSourceForTests } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entities';
import { DbSchemaCodes } from '@library/shared/common/data';

describe('Transfer Execution Integration', () => {
  let module: TestingModule;
  let domainServices: IDomainServices;
  let transferExecutionFactory: TransferExecutionFactory;
  let checkbookProvider: CheckbookTransferExecutionProvider;
  let fiservProvider: FiservTransferExecutionProvider;
  let mockProvider: MockTransferExecutionProvider;
  let tabapayProvider: TabapayTransferExecutionProvider;
  let databaseBackup: IBackup;

  // Test data
  const mockUserId = uuidv4();
  const mockLoanId = uuidv4();
  const mockTransferId = uuidv4();

  const mockCheckbookAccount: DeepPartial<IPaymentAccount> = {
    userId: mockUserId,
    type: PaymentAccountTypeCodes.BankAccount,
    ownership: PaymentAccountOwnershipTypeCodes.Personal,
    provider: PaymentAccountProviderCodes.Checkbook,
    isDefault: true,
    isActive: true,
    accountHolderName: 'John Doe',
  };

  const mockFiservAccount: DeepPartial<IPaymentAccount> = {
    userId: mockUserId,
    type: PaymentAccountTypeCodes.BankAccount,
    ownership: PaymentAccountOwnershipTypeCodes.Internal,
    provider: PaymentAccountProviderCodes.Fiserv,
    isDefault: true,
    isActive: true,
    accountHolderName: 'Zirtue Platform',
  };

  beforeAll(async () => {
    // Create in-memory database with Payment schema
    const memoryDBinstance = await memoryDataSourceForTests({ 
      entities: [...AllEntities], 
      schema: DbSchemaCodes.Payment, 
    });
    const { dataSource, database } = memoryDBinstance;
    
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

  beforeEach(() => {
    // Restore database to clean state before each test
    databaseBackup.restore();
  });

  describe('TransferExecutionFactory', () => {
    it('should get Checkbook provider for Checkbook accounts', async () => {
      // Use factory method with transferId parameter as it requires an actual transfer
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockCheckbookAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockFiservAccount);
      
      const payment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Created,
      }]);

      const transfer = await domainServices.paymentServices.createTransferForStep(steps![0].id);
      
      const provider = await transferExecutionFactory.getProvider(transfer!.id, PaymentAccountProviderCodes.Checkbook);
      
      expect(provider).toBeInstanceOf(CheckbookTransferExecutionProvider);
    });

    it('should get Fiserv provider for Fiserv accounts', async () => {
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockCheckbookAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockFiservAccount);
      
      const payment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Created,
      }]);

      const transfer = await domainServices.paymentServices.createTransferForStep(steps![0].id);
      
      const provider = await transferExecutionFactory.getProvider(transfer!.id, PaymentAccountProviderCodes.Fiserv);
      
      expect(provider).toBeInstanceOf(FiservTransferExecutionProvider);
    });

    it('should get Tabapay provider for Tabapay accounts', async () => {
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockCheckbookAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockFiservAccount);
      
      const payment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Created,
      }]);

      const transfer = await domainServices.paymentServices.createTransferForStep(steps![0].id);
      
      const provider = await transferExecutionFactory.getProvider(transfer!.id, PaymentAccountProviderCodes.Tabapay);
      
      expect(provider).toBeInstanceOf(TabapayTransferExecutionProvider);
    });

    it('should handle unsupported provider by returning mock provider', async () => {
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockCheckbookAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockFiservAccount);
      
      const payment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Created,
      }]);

      const transfer = await domainServices.paymentServices.createTransferForStep(steps![0].id);
      
      // Factory currently returns mock provider for any request
      const provider = await transferExecutionFactory.getProvider(transfer!.id);
      
      expect(provider).toBeInstanceOf(MockTransferExecutionProvider);
    });
  });

  describe('Transfer Execution Providers', () => {
    let mockTransfer: ITransfer | null;
    let sourceAccount: IPaymentAccount | null;
    let destAccount: IPaymentAccount | null;

    beforeEach(async () => {
      // Create payment accounts
      sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockCheckbookAccount);
      destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockFiservAccount);

      // Create a payment and step
      const payment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Created,
      }]);

      // Create transfer for the step
      mockTransfer = await domainServices.paymentServices.createTransferForStep(steps![0].id);
    });

    describe('CheckbookTransferExecutionProvider', () => {
      it('should execute transfer successfully', async () => {
        const result = await checkbookProvider.executeTransfer(mockTransfer!.id);
        
        expect(result).toBe(true);
        
        // Verify transfer still exists with created state since providers don't update state
        const updatedTransfer = await domainServices.paymentServices.getTransferById(mockTransfer!.id);
        expect(updatedTransfer!.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        const result = await checkbookProvider.executeTransfer(mockTransferId);
        
        expect(result).toBe(true); // Mock provider returns true regardless
      });
    });

    describe('FiservTransferExecutionProvider', () => {
      it('should execute transfer successfully', async () => {
        const result = await fiservProvider.executeTransfer(mockTransfer!.id);
        
        expect(result).toBe(true);
        
        // Verify transfer still exists with created state since providers don't update state
        const updatedTransfer = await domainServices.paymentServices.getTransferById(mockTransfer!.id);
        expect(updatedTransfer!.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        const result = await fiservProvider.executeTransfer(mockTransferId);
        
        expect(result).toBe(true); // Mock provider returns true regardless
      });
    });

    describe('MockTransferExecutionProvider', () => {
      it('should execute transfer successfully', async () => {
        const result = await mockProvider.executeTransfer(mockTransfer!.id);
        
        expect(result).toBe(true);
        
        // Verify transfer still exists with created state since providers don't update state
        const updatedTransfer = await domainServices.paymentServices.getTransferById(mockTransfer!.id);
        expect(updatedTransfer!.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        const result = await mockProvider.executeTransfer(mockTransferId);
        
        expect(result).toBe(true); // Mock provider returns true regardless
      });
    });

    describe('TabapayTransferExecutionProvider', () => {
      it('should execute transfer successfully', async () => {
        const result = await tabapayProvider.executeTransfer(mockTransfer!.id);
        
        expect(result).toBe(true);
        
        // Verify transfer still exists with created state since providers don't update state
        const updatedTransfer = await domainServices.paymentServices.getTransferById(mockTransfer!.id);
        expect(updatedTransfer!.state).toBe(TransferStateCodes.Created);
      });

      it('should handle transfer execution for non-existent transfer', async () => {
        const result = await tabapayProvider.executeTransfer(mockTransferId);
        
        expect(result).toBe(true); // Mock provider returns true regardless
      });
    });
  });

  describe('Transfer State Management', () => {
    let mockTransfer: ITransfer | null;

    beforeEach(async () => {
      // Create payment accounts
      const sourceAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockCheckbookAccount);
      const destAccount = await domainServices.paymentServices.addPaymentAccount(mockUserId, mockFiservAccount);

      // Create a payment and step
      const payment = await domainServices.paymentServices.createPayment({
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      });

      const steps = await domainServices.paymentServices.createPaymentSteps([{
        loanPaymentId: payment!.id,
        order: 0,
        amount: 1000,
        sourcePaymentAccountId: sourceAccount!.id,
        targetPaymentAccountId: destAccount!.id,
        state: PaymentStepStateCodes.Created,
      }]);

      // Create transfer for the step
      mockTransfer = await domainServices.paymentServices.createTransferForStep(steps![0].id);
    });

    it('should create transfer with initial state', async () => {
      const transfer = await domainServices.paymentServices.getTransferById(mockTransfer!.id);
      
      expect(transfer).toBeDefined();
      expect(transfer!.state).toBe(TransferStateCodes.Created);
      expect(transfer!.amount).toBe(1000);
    });

    it('should execute transfer through provider', async () => {
      const result = await checkbookProvider.executeTransfer(mockTransfer!.id);
      
      expect(result).toBe(true);
      
      // Transfer state remains created since providers don't update state in this implementation
      const updatedTransfer = await domainServices.paymentServices.getTransferById(mockTransfer!.id);
      expect(updatedTransfer).toBeDefined();
      expect(updatedTransfer!.state).toBe(TransferStateCodes.Created);
    });
  });
});
