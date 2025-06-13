import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
import { IDomainServices } from '../../src/domain/idomain.services';
import { LoanPaymentStepFactory } from '../../src/loan-payment-steps/loan-payment-step.factory';
import { 
  CreatedStepManager, 
  PendingStepManager, 
  FailedStepManager, 
  CompletedStepManager, 
} from '../../src/loan-payment-steps/managers';
import { 
  ILoanPaymentStep, 
  ITransfer, 
} from '@library/entity/interface';
import { 
  PaymentStepState,
  PaymentStepStateCodes,
  TransferState,
  TransferStateCodes,
  PaymentAccountProvider,
  PaymentAccountProviderCodes,
} from '@library/entity/enum';
import { DeepPartial } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { initializeTransactionalContext, patchTypeORMRepositoryWithBaseRepository } from 'typeorm-transactional';
import { PaymentStepStateIsOutOfSyncException } from '../../src/domain/exceptions';
import { LOAN_PAYMENT_STEP_RELATIONS } from '@library/shared/domain/entities/relations';

describe('Loan Payment Step Managers Integration', () => {
  let domainServices: IDomainServices;
  let createdManager: CreatedStepManager;
  let pendingManager: PendingStepManager;
  let failedManager: FailedStepManager;
  let completedManager: CompletedStepManager;
  let stepFactory: LoanPaymentStepFactory;

  // Test data
  const mockStepId = uuidv4();
  const mockPaymentId = uuidv4();
  const mockTransferId = uuidv4();
  const mockSourceAccountId = uuidv4();
  const mockTargetAccountId = uuidv4();

  // Mock objects
  const mockStep: DeepPartial<ILoanPaymentStep> = {
    id: mockStepId,
    loanPaymentId: mockPaymentId,
    amount: 1000,
    order: 0,
    sourcePaymentAccountId: mockSourceAccountId,
    targetPaymentAccountId: mockTargetAccountId,
    state: PaymentStepStateCodes.Created,
  };

  const mockTransfer: DeepPartial<ITransfer> = {
    id: mockTransferId,
    loanPaymentStepId: mockStepId,
    amount: 1000,
    sourceAccountId: mockSourceAccountId,
    destinationAccountId: mockTargetAccountId,
    state: TransferStateCodes.Created,
    order: 0,
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
        LoanPaymentStepFactory,
        CreatedStepManager,
        PendingStepManager,
        FailedStepManager,
        CompletedStepManager,
      ],
    }).compile();

    domainServices = module.get<IDomainServices>(IDomainServices);
    createdManager = module.get<CreatedStepManager>(CreatedStepManager);
    pendingManager = module.get<PendingStepManager>(PendingStepManager);
    failedManager = module.get<FailedStepManager>(FailedStepManager);
    completedManager = module.get<CompletedStepManager>(CompletedStepManager);
    stepFactory = module.get<LoanPaymentStepFactory>(LoanPaymentStepFactory);

    // Setup spies on domain services
    jest.spyOn(domainServices.paymentServices, 'getLoanPaymentStepById').mockResolvedValue(mockStep as ILoanPaymentStep);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('LoanPaymentStepFactory', () => {
    it('should return the correct manager based on state', async () => {
      expect(await stepFactory.getManager(mockStepId, PaymentStepStateCodes.Created)).toBe(createdManager);
      expect(await stepFactory.getManager(mockStepId, PaymentStepStateCodes.Pending)).toBe(pendingManager);
      expect(await stepFactory.getManager(mockStepId, PaymentStepStateCodes.Failed)).toBe(failedManager);
      expect(await stepFactory.getManager(mockStepId, PaymentStepStateCodes.Completed)).toBe(completedManager);
    });

    it('should fetch step state if not provided', async () => {
      const result = await stepFactory.getManager(mockStepId);
      expect(domainServices.paymentServices.getLoanPaymentStepById).toHaveBeenCalledWith(mockStepId);
      expect(result).toBe(createdManager);
    });

    it('should throw error for unsupported state', async () => {
      await expect(stepFactory.getManager(mockStepId, 'unsupported' as PaymentStepState))
        .rejects.toThrow();
    });
  });

  describe('CreatedStepManager', () => {
    beforeEach(() => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockImplementation(async (stepId) => {
        return stepId === mockStepId ? mockTransfer as ITransfer : null;
      });
      jest.spyOn(domainServices.paymentServices, 'updatePaymentStepState').mockResolvedValue(true);
      jest.spyOn(domainServices.paymentServices, 'createTransferForStep').mockResolvedValue(mockTransfer as ITransfer);
    });

    it('should create a transfer if none exists', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValueOnce(null);
      
      const result = await createdManager.advance(mockStepId);
      
      expect(result).toBeTruthy();
      expect(domainServices.paymentServices.createTransferForStep).toHaveBeenCalledWith(mockStepId);
      expect(domainServices.paymentServices.updatePaymentStepState).toHaveBeenCalledWith(
        mockStepId, 
        PaymentStepStateCodes.Pending
      );
    });

    it('should update step to pending when transfer is in created state', async () => {
      const result = await createdManager.advance(mockStepId);
      
      expect(result).toBeTruthy();
      expect(domainServices.paymentServices.updatePaymentStepState).toHaveBeenCalledWith(
        mockStepId, 
        PaymentStepStateCodes.Pending
      );
    });

    it('should throw an exception when transfer is completed (out of sync)', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValueOnce({
        ...mockTransfer,
        state: TransferStateCodes.Completed,
      } as ITransfer);
      
      await expect(createdManager.advance(mockStepId)).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should throw an exception when transfer has failed (out of sync)', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValueOnce({
        ...mockTransfer,
        state: TransferStateCodes.Failed,
      } as ITransfer);
      
      await expect(createdManager.advance(mockStepId)).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });

    it('should take no action if transfer is in pending state', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValueOnce({
        ...mockTransfer,
        state: TransferStateCodes.Pending,
      } as ITransfer);
      
      const result = await createdManager.advance(mockStepId);
      
      expect(result).toBe(false);
      expect(domainServices.paymentServices.updatePaymentStepState).not.toHaveBeenCalled();
    });
  });

  describe('PendingStepManager', () => {
    beforeEach(() => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValue({
        ...mockTransfer,
        state: TransferStateCodes.Pending,
      } as ITransfer);
      jest.spyOn(domainServices.paymentServices, 'updatePaymentStepState').mockResolvedValue(true);
      jest.spyOn(domainServices.management, 'executeTransfer').mockResolvedValue(true);
    });

    it('should execute transfer when in created state', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValueOnce({
        ...mockTransfer,
        state: TransferStateCodes.Created,
      } as ITransfer);
      
      const result = await pendingManager.advance(mockStepId);
      
      expect(result).toBeTruthy();
      expect(domainServices.management.executeTransfer).toHaveBeenCalledWith(mockTransferId, undefined);
    });

    it('should update step to completed when transfer completes', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValueOnce({
        ...mockTransfer,
        state: TransferStateCodes.Completed,
      } as ITransfer);
      
      const result = await pendingManager.advance(mockStepId);
      
      expect(result).toBeTruthy();
      expect(domainServices.paymentServices.updatePaymentStepState).toHaveBeenCalledWith(
        mockStepId, 
        PaymentStepStateCodes.Completed
      );
    });

    it('should update step to failed when transfer fails', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValueOnce({
        ...mockTransfer,
        state: TransferStateCodes.Failed,
      } as ITransfer);
      
      const result = await pendingManager.advance(mockStepId);
      
      expect(result).toBeTruthy();
      expect(domainServices.paymentServices.updatePaymentStepState).toHaveBeenCalledWith(
        mockStepId, 
        PaymentStepStateCodes.Failed
      );
    });

    it('should take no action if transfer is still pending', async () => {
      const result = await pendingManager.advance(mockStepId);
      
      expect(result).toBe(false);
      expect(domainServices.paymentServices.updatePaymentStepState).not.toHaveBeenCalled();
      expect(domainServices.management.executeTransfer).not.toHaveBeenCalled();
    });
  });

  describe('FailedStepManager', () => {
    beforeEach(() => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValue({
        ...mockTransfer,
        state: TransferStateCodes.Failed,
      } as ITransfer);
      jest.spyOn(domainServices.paymentServices, 'updatePaymentStepState').mockResolvedValue(true);
      jest.spyOn(domainServices.paymentServices, 'createTransferForStep').mockResolvedValue({
        ...mockTransfer,
        id: uuidv4(),
        state: TransferStateCodes.Created,
      } as ITransfer);
    });

    it('should create new transfer when retrying a failed step', async () => {
      const result = await failedManager.advance(mockStepId);
      
      expect(result).toBeTruthy();
      expect(domainServices.paymentServices.createTransferForStep).toHaveBeenCalledWith(mockStepId);
      expect(domainServices.paymentServices.updatePaymentStepState).toHaveBeenCalledWith(
        mockStepId, 
        PaymentStepStateCodes.Pending
      );
    });

    it('should throw exception when transfer is in inconsistent state', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValueOnce({
        ...mockTransfer,
        state: TransferStateCodes.Completed,
      } as ITransfer);
      
      await expect(failedManager.advance(mockStepId)).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });
  });

  describe('CompletedStepManager', () => {
    beforeEach(() => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValue({
        ...mockTransfer,
        state: TransferStateCodes.Completed,
      } as ITransfer);
    });

    it('should take no action for a completed step', async () => {
      const result = await completedManager.advance(mockStepId);
      
      expect(result).toBe(false);
      expect(domainServices.paymentServices.updatePaymentStepState).not.toHaveBeenCalled();
    });

    it('should throw exception when transfer is in inconsistent state', async () => {
      jest.spyOn(domainServices.paymentServices, 'getLatestTransferForStep').mockResolvedValueOnce({
        ...mockTransfer,
        state: TransferStateCodes.Failed,
      } as ITransfer);
      
      await expect(completedManager.advance(mockStepId)).rejects.toThrow(PaymentStepStateIsOutOfSyncException);
    });
  });
});
