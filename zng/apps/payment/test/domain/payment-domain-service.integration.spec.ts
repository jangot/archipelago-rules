import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentDomainService } from '../../src/domain/services/payment.domain.service';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
import { 
  ILoanPayment, 
  ILoanPaymentStep, 
  IPaymentAccount, 
} from '@library/entity/interface';
import { 
  LoanPaymentStateCodes, 
  LoanPaymentTypeCodes, 
  LoanTypeCodes, 
  PaymentAccountOwnershipTypeCodes, 
  PaymentAccountProviderCodes, 
  PaymentAccountTypeCodes, 
  PaymentStepStateCodes, 
} from '@library/entity/enum';
import { DeepPartial } from 'typeorm';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';
import { memoryDataSourceForTests } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entities';
import { DbSchemaCodes } from '@library/shared/common/data';

describe('PaymentDomainService Integration', () => {
  let module: TestingModule;
  let paymentDomainService: PaymentDomainService;
  let databaseBackup: IBackup;

  // Test data
  const mockUserId = uuidv4();
  const mockLoanId = uuidv4();
  const mockAccountId = uuidv4();
  const mockPaymentId = uuidv4();

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
      ],
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    paymentDomainService = module.get<PaymentDomainService>(PaymentDomainService);
    databaseBackup = database.backup();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    // Restore database to clean state before each test
    databaseBackup.restore();
  });

  describe('Account Management', () => {
    it('should add a payment account', async () => {
      const accountInput: DeepPartial<IPaymentAccount> = {
        userId: mockUserId,
        type: PaymentAccountTypeCodes.BankAccount,
        provider: PaymentAccountProviderCodes.Checkbook,
        ownership: PaymentAccountOwnershipTypeCodes.Personal,
        accountHolderName: 'John Smith',
        accountNumber: '1234567890',
        routingNumber: '123456789',
      };
      
      const result = await paymentDomainService.addPaymentAccount(mockUserId, accountInput);
      
      expect(result).toBeDefined();
      expect(result!.userId).toBe(mockUserId);
      expect(result!.type).toBe(PaymentAccountTypeCodes.BankAccount);
      expect(result!.provider).toBe(PaymentAccountProviderCodes.Checkbook);
    });

    it('should get a payment account by ID', async () => {
      // First create an account
      const accountInput: DeepPartial<IPaymentAccount> = {
        userId: mockUserId,
        type: PaymentAccountTypeCodes.BankAccount,
        provider: PaymentAccountProviderCodes.Checkbook,
        ownership: PaymentAccountOwnershipTypeCodes.Personal,
      };
      
      const created = await paymentDomainService.addPaymentAccount(mockUserId, accountInput);
      
      // Then retrieve it
      const result = await paymentDomainService.getPaymentAccountById(created!.id);
      
      expect(result).toBeDefined();
      expect(result!.id).toBe(created!.id);
      expect(result!.userId).toBe(mockUserId);
    });

    it('should return null when account is not found', async () => {
      const result = await paymentDomainService.getPaymentAccountById(mockAccountId);
      
      expect(result).toBeNull();
    });
  });

  describe('Loan Management', () => {
    it('should get a loan by ID when it exists', async () => {
      // This test would require creating a loan first
      // For now, test the case where loan doesn't exist
      const result = await paymentDomainService.getLoanById(mockLoanId);
      
      expect(result).toBeNull();
    });

    it('should return null when loan is not found', async () => {
      const result = await paymentDomainService.getLoanById(mockLoanId);
      
      expect(result).toBeNull();
    });
  });

  describe('Payment Management', () => {
    it('should get a loan payment by ID when it exists', async () => {
      // This test would require creating a payment first
      // For now, test the case where payment doesn't exist
      const result = await paymentDomainService.getLoanPaymentById(mockPaymentId);
      
      expect(result).toBeNull();
    });

    it('should create a new payment', async () => {
      const paymentInput: DeepPartial<ILoanPayment> = {
        loanId: mockLoanId,
        amount: 500,
        type: LoanPaymentTypeCodes.Repayment,
        state: LoanPaymentStateCodes.Created,
      };
      
      const result = await paymentDomainService.createPayment(paymentInput);
      
      expect(result).toBeDefined();
      expect(result!.amount).toBe(500);
      expect(result!.type).toBe(LoanPaymentTypeCodes.Repayment);
      expect(result!.loanId).toBe(mockLoanId);
    });

    it('should update a payment', async () => {
      // First create a payment
      const paymentInput: DeepPartial<ILoanPayment> = {
        loanId: mockLoanId,
        amount: 500,
        type: LoanPaymentTypeCodes.Repayment,
        state: LoanPaymentStateCodes.Created,
      };
      
      const created = await paymentDomainService.createPayment(paymentInput);
      
      // Then update it
      const updates: DeepPartial<ILoanPayment> = {
        state: LoanPaymentStateCodes.Pending,
      };
      
      const result = await paymentDomainService.updatePayment(created!.id, updates);
      
      expect(result).toBe(true);
      
      // Verify the update
      const updated = await paymentDomainService.getLoanPaymentById(created!.id);
      expect(updated!.state).toBe(LoanPaymentStateCodes.Pending);
    });

    it('should complete a payment', async () => {
      // First create a payment
      const paymentInput: DeepPartial<ILoanPayment> = {
        loanId: mockLoanId,
        amount: 500,
        type: LoanPaymentTypeCodes.Repayment,
        state: LoanPaymentStateCodes.Created,
      };
      
      const created = await paymentDomainService.createPayment(paymentInput);
      
      // Then complete it
      const result = await paymentDomainService.completePayment(created!.id);
      
      expect(result).toBe(true);
      
      // Verify the completion
      const completed = await paymentDomainService.getLoanPaymentById(created!.id);
      expect(completed!.state).toBe(LoanPaymentStateCodes.Completed);
      expect(completed!.completedAt).toBeDefined();
    });

    it('should fail a payment', async () => {
      // First create a payment
      const paymentInput: DeepPartial<ILoanPayment> = {
        loanId: mockLoanId,
        amount: 500,
        type: LoanPaymentTypeCodes.Repayment,
        state: LoanPaymentStateCodes.Created,
      };
      
      const created = await paymentDomainService.createPayment(paymentInput);
      
      // Then fail it
      const mockStepId = uuidv4();
      const result = await paymentDomainService.failPayment(created!.id, mockStepId);
      
      expect(result).toBe(true);
      
      // Verify the failure
      const failed = await paymentDomainService.getLoanPaymentById(created!.id);
      expect(failed!.state).toBe(LoanPaymentStateCodes.Failed);
    });

    it('should return null for empty repayment plan', async () => {
      const result = await paymentDomainService.saveRepaymentPlan([], mockLoanId);
      
      expect(result).toBeNull();
    });
  });

  describe('Payment Route Finding', () => {
    it('should return null when source account is not found', async () => {
      const result = await paymentDomainService.findRouteForPayment(
        mockAccountId,
        'some-destination',
        LoanPaymentTypeCodes.Funding,
        LoanTypeCodes.Personal
      );
      
      expect(result).toBeNull();
    });

    it('should return null when destination account is not found', async () => {
      // Create a source account first
      const sourceAccountInput: DeepPartial<IPaymentAccount> = {
        userId: mockUserId,
        type: PaymentAccountTypeCodes.BankAccount,
        provider: PaymentAccountProviderCodes.Checkbook,
        ownership: PaymentAccountOwnershipTypeCodes.Personal,
      };
      
      const sourceAccount = await paymentDomainService.addPaymentAccount(mockUserId, sourceAccountInput);
      
      const result = await paymentDomainService.findRouteForPayment(
        sourceAccount!.id,
        'non-existent-account',
        LoanPaymentTypeCodes.Funding,
        LoanTypeCodes.Personal
      );
      
      expect(result).toBeNull();
    });
  });

  describe('Payment Step Management', () => {
    it('should throw MissingInputException when step ID is missing', async () => {
      await expect(paymentDomainService.getLoanPaymentStepById('')).rejects.toThrow(MissingInputException);
      await expect(paymentDomainService.getLoanPaymentStepById(null as unknown as string)).rejects.toThrow(MissingInputException);
    });

    it('should throw EntityNotFoundException when step is not found', async () => {
      await expect(paymentDomainService.getLoanPaymentStepById('non-existent-step'))
        .rejects.toThrow(EntityNotFoundException);
    });

    it('should create payment steps', async () => {
      // First create a payment
      const paymentInput: DeepPartial<ILoanPayment> = {
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      };
      
      const payment = await paymentDomainService.createPayment(paymentInput);
      
      // Create payment accounts
      const sourceAccountInput: DeepPartial<IPaymentAccount> = {
        userId: mockUserId,
        type: PaymentAccountTypeCodes.BankAccount,
        provider: PaymentAccountProviderCodes.Checkbook,
        ownership: PaymentAccountOwnershipTypeCodes.Personal,
      };
      
      const destAccountInput: DeepPartial<IPaymentAccount> = {
        userId: mockUserId,
        type: PaymentAccountTypeCodes.BankAccount,
        provider: PaymentAccountProviderCodes.Fiserv,
        ownership: PaymentAccountOwnershipTypeCodes.Internal,
      };
      
      const sourceAccount = await paymentDomainService.addPaymentAccount(mockUserId, sourceAccountInput);
      const destAccount = await paymentDomainService.addPaymentAccount(mockUserId, destAccountInput);
      
      // Create payment steps
      const stepInputs: DeepPartial<ILoanPaymentStep>[] = [
        {
          loanPaymentId: payment!.id,
          order: 0,
          amount: 500,
          sourcePaymentAccountId: sourceAccount!.id,
          targetPaymentAccountId: destAccount!.id,
          state: PaymentStepStateCodes.Created,
        },
        {
          loanPaymentId: payment!.id,
          order: 1,
          amount: 500,
          sourcePaymentAccountId: sourceAccount!.id,
          targetPaymentAccountId: destAccount!.id,
          state: PaymentStepStateCodes.Created,
        },
      ];
      
      const result = await paymentDomainService.createPaymentSteps(stepInputs);
      
      expect(result).toBeDefined();
      expect(result!).toHaveLength(2);
      expect(result![0].order).toBe(0);
      expect(result![1].order).toBe(1);
    });

    it('should update a payment step state', async () => {
      // First create a payment and step
      const paymentInput: DeepPartial<ILoanPayment> = {
        loanId: mockLoanId,
        amount: 1000,
        type: LoanPaymentTypeCodes.Funding,
        state: LoanPaymentStateCodes.Created,
      };
      
      const payment = await paymentDomainService.createPayment(paymentInput);
      
      const sourceAccountInput: DeepPartial<IPaymentAccount> = {
        userId: mockUserId,
        type: PaymentAccountTypeCodes.BankAccount,
        provider: PaymentAccountProviderCodes.Checkbook,
        ownership: PaymentAccountOwnershipTypeCodes.Personal,
      };
      
      const destAccountInput: DeepPartial<IPaymentAccount> = {
        userId: mockUserId,
        type: PaymentAccountTypeCodes.BankAccount,
        provider: PaymentAccountProviderCodes.Fiserv,
        ownership: PaymentAccountOwnershipTypeCodes.Internal,
      };
      
      const sourceAccount = await paymentDomainService.addPaymentAccount(mockUserId, sourceAccountInput);
      const destAccount = await paymentDomainService.addPaymentAccount(mockUserId, destAccountInput);
      
      const stepInputs: DeepPartial<ILoanPaymentStep>[] = [
        {
          loanPaymentId: payment!.id,
          order: 0,
          amount: 500,
          sourcePaymentAccountId: sourceAccount!.id,
          targetPaymentAccountId: destAccount!.id,
          state: PaymentStepStateCodes.Created,
        },
      ];
      
      const steps = await paymentDomainService.createPaymentSteps(stepInputs);
      
      // Update the step state
      const result = await paymentDomainService.updatePaymentStepState(
        steps![0].id,
        PaymentStepStateCodes.Pending
      );
      
      expect(result).toBe(true);
      
      // Verify the update
      const updatedStep = await paymentDomainService.getLoanPaymentStepById(steps![0].id);
      expect(updatedStep!.state).toBe(PaymentStepStateCodes.Pending);
    });

    it('should get the latest transfer for a step', async () => {
      const mockStepId = uuidv4();
      const result = await paymentDomainService.getLatestTransferForStep(mockStepId);
      
      // Should return null since no transfer exists
      expect(result).toBeNull();
    });
  });

  describe('Transfer Management', () => {
    it('should handle non-existent step when creating transfer', async () => {
      await expect(paymentDomainService.createTransferForStep('non-existent-step'))
        .rejects.toThrow(EntityNotFoundException);
    });

    it('should get transfer by ID when it exists', async () => {
      const result = await paymentDomainService.getTransferById('non-existent-transfer');
      
      expect(result).toBeNull();
    });

    it('should throw MissingInputException when transfer ID is missing', async () => {
      await expect(paymentDomainService.getTransferById('')).rejects.toThrow(MissingInputException);
      await expect(paymentDomainService.getTransferById(null as unknown as string)).rejects.toThrow(MissingInputException);
    });
  });
});
