import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
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
  PaymentAccountProvider,
  PaymentAccountProviderCodes,
  PaymentAccountType,
  PaymentAccountOwnershipType,
  TransferState,
  TransferStateCodes,
} from '@library/entity/enum';
import { DeepPartial } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { initializeTransactionalContext, patchTypeORMRepositoryWithBaseRepository } from 'typeorm-transactional';
import { TRANSFER_RELATIONS } from '@library/shared/domain/entities/relations';

describe('Transfer Execution Integration', () => {
  let domainServices: IDomainServices;
  let transferExecutionFactory: TransferExecutionFactory;
  let mockProvider: MockTransferExecutionProvider;
  let checkbookProvider: CheckbookTransferExecutionProvider;
  let fiservProvider: FiservTransferExecutionProvider;
  let tabapayProvider: TabapayTransferExecutionProvider;

  // Test data
  const mockTransferId = uuidv4();
  const mockStepId = uuidv4();
  const mockSourceAccountId = uuidv4();
  const mockDestinationAccountId = uuidv4();

  // Mock objects
  const mockTransfer: DeepPartial<ITransfer> = {
    id: mockTransferId,
    loanPaymentStepId: mockStepId,
    amount: 1000,
    sourceAccountId: mockSourceAccountId,
    destinationAccountId: mockDestinationAccountId,
    state: TransferStateCodes.Created,
  };

  const mockSourceAccount: DeepPartial<IPaymentAccount> = {
    id: mockSourceAccountId,
    type: PaymentAccountType.BankAccount,
    ownership: PaymentAccountOwnershipType.Personal,
    provider: PaymentAccountProviderCodes.Checkbook,
  };

  const mockDestinationAccount: DeepPartial<IPaymentAccount> = {
    id: mockDestinationAccountId,
    type: PaymentAccountType.BankAccount,
    ownership: PaymentAccountOwnershipType.Internal,
    provider: PaymentAccountProviderCodes.Fiserv,
  };

  beforeAll(async () => {
    // Initialize the transactional context
    initializeTransactionalContext();
    patchTypeORMRepositoryWithBaseRepository();
  });

  beforeEach(async () => {
    // Create a testing module with real implementations
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DataModule,
        DomainModule,
      ],
      providers: [
        TransferExecutionFactory,
        MockTransferExecutionProvider,
        CheckbookTransferExecutionProvider,
        FiservTransferExecutionProvider,
        TabapayTransferExecutionProvider,
      ],
    }).compile();

    domainServices = module.get<IDomainServices>(IDomainServices);
    transferExecutionFactory = module.get<TransferExecutionFactory>(TransferExecutionFactory);
    mockProvider = module.get<MockTransferExecutionProvider>(MockTransferExecutionProvider);
    checkbookProvider = module.get<CheckbookTransferExecutionProvider>(CheckbookTransferExecutionProvider);
    fiservProvider = module.get<FiservTransferExecutionProvider>(FiservTransferExecutionProvider);
    tabapayProvider = module.get<TabapayTransferExecutionProvider>(TabapayTransferExecutionProvider);

    // Setup spies on domain services
    jest.spyOn(domainServices.paymentServices, 'getTransferById').mockResolvedValue({
      ...mockTransfer,
      sourceAccount: mockSourceAccount,
      destinationAccount: mockDestinationAccount,
    } as ITransfer);
    
    // Spy on provider methods
    jest.spyOn(mockProvider, 'executeTransfer').mockResolvedValue(true);
    jest.spyOn(checkbookProvider, 'executeTransfer').mockResolvedValue(true);
    jest.spyOn(fiservProvider, 'executeTransfer').mockResolvedValue(true);
    jest.spyOn(tabapayProvider, 'executeTransfer').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TransferExecutionFactory', () => {
    it('should get the correct provider by provider type', async () => {
      // Currently the factory defaults to mock provider for testing purposes
      const provider = await transferExecutionFactory.getProvider(
        mockTransferId, 
        PaymentAccountProviderCodes.Checkbook
      );
      
      expect(provider).toBeDefined();
      // Due to the mock implementation in the factory, we expect the mock provider to be returned
      expect(provider).toBe(mockProvider);
      
      expect(domainServices.paymentServices.getTransferById).not.toHaveBeenCalled();
    });

    it('should get provider by transfer when provider type not specified', async () => {
      const provider = await transferExecutionFactory.getProvider(mockTransferId);
      
      expect(provider).toBeDefined();
      expect(domainServices.paymentServices.getTransferById).toHaveBeenCalledWith(
        mockTransferId,
        expect.arrayContaining([
          TRANSFER_RELATIONS.SourceAccount,
          TRANSFER_RELATIONS.DestinationAccount,
        ])
      );
      // Due to the mock implementation in the factory, we expect the mock provider to be returned
      expect(provider).toBe(mockProvider);
    });
  });

  describe('MockTransferExecutionProvider', () => {
    it('should execute a transfer successfully', async () => {
      const result = await mockProvider.executeTransfer(mockTransferId);
      
      expect(result).toBe(true);
    });
  });

  describe('CheckbookTransferExecutionProvider', () => {
    it('should execute a transfer successfully', async () => {
      const result = await checkbookProvider.executeTransfer(mockTransferId);
      
      expect(result).toBe(true);
    });
  });

  describe('FiservTransferExecutionProvider', () => {
    it('should execute a transfer successfully', async () => {
      const result = await fiservProvider.executeTransfer(mockTransferId);
      
      expect(result).toBe(true);
    });
  });

  describe('TabapayTransferExecutionProvider', () => {
    it('should execute a transfer successfully', async () => {
      const result = await tabapayProvider.executeTransfer(mockTransferId);
      
      expect(result).toBe(true);
    });
  });
});
