import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentDomainService } from '../../src/domain/services/payment.domain.service';
import { PaymentDataService } from '../../src/data/data.service';
import { 
  ILoan,
  ILoanPayment, 
  ILoanPaymentStep, 
  IPaymentAccount, 
  IPaymentsRoute,
  IPaymentsRouteStep,
  ITransfer,
} from '@library/entity/interface';
import { 
  LoanPaymentStateCodes, 
  LoanPaymentTypeCodes, 
  LoanTypeCodes, 
  PaymentAccountOwnershipType, 
  PaymentAccountProvider, 
  PaymentAccountProviderCodes, 
  PaymentAccountType, 
  PaymentStepStateCodes, 
  TransferStateCodes, 
} from '@library/entity/enum';
import { DeepPartial } from 'typeorm';
import { LOAN_PAYMENT_STEP_RELATIONS, PAYMENTS_ROUTE_RELATIONS } from '@library/shared/domain/entities/relations';
import { v4 as uuidv4 } from 'uuid';
import { initializeTransactionalContext, patchTypeORMRepositoryWithBaseRepository } from 'typeorm-transactional';
import { EntityNotFoundException, MissingInputException } from '@library/shared/common/exceptions/domain';
import { PlanPreviewOutputItem } from '@library/shared/types/lending';
import { MockType, mockRepositoryFactory } from '../testing-utils';
import {
  ILoanPaymentRepository,
  ILoanPaymentStepRepository,
  ILoanRepository,
  IPaymentAccountRepository,
  IPaymentsRouteRepository,
  IPaymentsRouteStepRepository,
  ITransferErrorRepository,
  ITransferRepository,
} from '@payment/shared/interfaces/repositories';

describe('PaymentDomainService Integration', () => {
  let paymentDomainService: PaymentDomainService;
  let paymentDataService: PaymentDataService;
  let configService: ConfigService;

  // Repository mocks
  let mockLoanPaymentRepository: MockType<ILoanPaymentRepository>;
  let mockLoanPaymentStepRepository: MockType<ILoanPaymentStepRepository>;
  let mockPaymentAccountRepository: MockType<IPaymentAccountRepository>;
  let mockLoanRepository: MockType<ILoanRepository>;
  let mockPaymentsRouteRepository: MockType<IPaymentsRouteRepository>;
  let mockPaymentsRouteStepRepository: MockType<IPaymentsRouteStepRepository>;
  let mockTransferRepository: MockType<ITransferRepository>;
  let mockTransferErrorRepository: MockType<ITransferErrorRepository>;

  // Test data
  const mockUserId = uuidv4();
  const mockLoanId = uuidv4();
  const mockPaymentId = uuidv4();
  const mockStepId = uuidv4();
  const mockTransferId = uuidv4();
  const mockSourceAccountId = uuidv4();
  const mockDestinationAccountId = uuidv4();
  const mockRouteId = uuidv4();

  const mockPaymentAccount: DeepPartial<IPaymentAccount> = {
    id: mockSourceAccountId,
    userId: mockUserId,
    type: PaymentAccountType.BankAccount,
    ownership: PaymentAccountOwnershipType.Personal,
    provider: PaymentAccountProviderCodes.Checkbook,
    isDefault: true,
    isActive: true,
    accountHolderName: 'John Doe',
    accountNumber: '1234567890',
    routingNumber: '123456789',
  };

  const mockDestinationAccount: DeepPartial<IPaymentAccount> = {
    id: mockDestinationAccountId,
    userId: mockUserId,
    type: PaymentAccountType.BankAccount,
    ownership: PaymentAccountOwnershipType.Internal,
    provider: PaymentAccountProviderCodes.Fiserv,
    isDefault: true,
    isActive: true,
    accountHolderName: 'Zirtue Platform',
    accountNumber: '0987654321',
    routingNumber: '987654321',
  };

  const mockLoan: DeepPartial<ILoan> = {
    id: mockLoanId,
    lenderAccountId: mockSourceAccountId,
    borrowerAccountId: mockDestinationAccountId,
    amount: 1000,
    type: LoanTypeCodes.P2p,
  };

  const mockLoanPayment: DeepPartial<ILoanPayment> = {
    id: mockPaymentId,
    loanId: mockLoanId,
    amount: 1000,
    type: LoanPaymentTypeCodes.Funding,
    state: LoanPaymentStateCodes.Created,
    paymentNumber: null,
  };

  const mockLoanPaymentStep: DeepPartial<ILoanPaymentStep> = {
    id: mockStepId,
    loanPaymentId: mockPaymentId,
    order: 0,
    amount: 1000,
    sourcePaymentAccountId: mockSourceAccountId,
    targetPaymentAccountId: mockDestinationAccountId,
    state: PaymentStepStateCodes.Created,
    transfers: [],
  };

  const mockRouteStep: DeepPartial<IPaymentsRouteStep> = {
    id: uuidv4(),
    routeId: mockRouteId,
    order: 0,
    fromId: mockSourceAccountId,
    toId: mockDestinationAccountId,
  };

  const mockRoute: DeepPartial<IPaymentsRoute> = {
    id: mockRouteId,
    fromAccount: PaymentAccountType.BankAccount,
    fromOwnership: PaymentAccountOwnershipType.Personal,
    fromProvider: PaymentAccountProviderCodes.Checkbook,
    toAccount: PaymentAccountType.BankAccount,
    toOwnership: PaymentAccountOwnershipType.Internal,
    toProvider: PaymentAccountProviderCodes.Fiserv,
    steps: [mockRouteStep as IPaymentsRouteStep],
  };

  const mockTransfer: DeepPartial<ITransfer> = {
    id: mockTransferId,
    loanPaymentStepId: mockStepId,
    amount: 1000,
    sourceAccountId: mockSourceAccountId,
    destinationAccountId: mockDestinationAccountId,
    state: TransferStateCodes.Created,
    order: 0,
  };

  beforeAll(async () => {
    // Initialize the transactional context
    initializeTransactionalContext();
    patchTypeORMRepositoryWithBaseRepository();
  });

  beforeEach(async () => {
    // Create repository mocks
    mockLoanPaymentRepository = mockRepositoryFactory();
    mockLoanPaymentStepRepository = mockRepositoryFactory();
    mockPaymentAccountRepository = mockRepositoryFactory();
    mockLoanRepository = mockRepositoryFactory();
    mockPaymentsRouteRepository = mockRepositoryFactory();
    mockPaymentsRouteStepRepository = mockRepositoryFactory();
    mockTransferRepository = mockRepositoryFactory();
    mockTransferErrorRepository = mockRepositoryFactory();

    // Setup specific repository mock implementations
    mockPaymentAccountRepository.createPaymentAccount = jest.fn().mockImplementation(
      async (input: DeepPartial<IPaymentAccount>) => ({ ...mockPaymentAccount, ...input })
    );
    
    mockPaymentAccountRepository.getPaymentAccountById = jest.fn().mockImplementation(
      async (id: string) => {
        if (id === mockSourceAccountId) return mockPaymentAccount;
        if (id === mockDestinationAccountId) return mockDestinationAccount;
        return null;
      }
    );

    mockLoanRepository.getLoanById = jest.fn().mockImplementation(
      async (id: string) => id === mockLoanId ? mockLoan : null
    );

    mockLoanPaymentRepository.getPaymentById = jest.fn().mockImplementation(
      async (id: string) => id === mockPaymentId ? mockLoanPayment : null
    );

    mockLoanPaymentRepository.createPayment = jest.fn().mockImplementation(
      async (input: DeepPartial<ILoanPayment>) => ({ ...mockLoanPayment, ...input })
    );

    mockLoanPaymentRepository.createPayments = jest.fn().mockImplementation(
      async (inputs: DeepPartial<ILoanPayment>[]) => inputs.map(input => ({ ...mockLoanPayment, ...input }))
    );

    mockLoanPaymentRepository.updatePayment = jest.fn().mockResolvedValue(true);

    mockLoanPaymentStepRepository.getStepById = jest.fn().mockImplementation(
      async (id: string) => id === mockStepId ? mockLoanPaymentStep : null
    );

    mockLoanPaymentStepRepository.createPaymentSteps = jest.fn().mockImplementation(
      async (inputs: DeepPartial<ILoanPaymentStep>[]) => inputs.map(input => ({ ...mockLoanPaymentStep, ...input }))
    );

    mockLoanPaymentStepRepository.updateStepState = jest.fn().mockResolvedValue(true);

    mockPaymentsRouteRepository.findRoute = jest.fn().mockResolvedValue(mockRoute);

    mockTransferRepository.getLatestTransferForStep = jest.fn().mockImplementation(
      async (stepId: string) => stepId === mockStepId ? mockTransfer : null
    );

    mockTransferRepository.createTransferForStep = jest.fn().mockImplementation(
      async (input: DeepPartial<ITransfer>) => ({ ...mockTransfer, ...input })
    );

    mockTransferRepository.getTransferById = jest.fn().mockImplementation(
      async (id: string) => id === mockTransferId ? mockTransfer : null
    );

    // Create mock DataService and inject mocked repositories
    const dataService = {
      loanPayments: mockLoanPaymentRepository,
      loanPaymentSteps: mockLoanPaymentStepRepository,
      paymentAccounts: mockPaymentAccountRepository,
      loans: mockLoanRepository,
      paymentsRoute: mockPaymentsRouteRepository,
      paymentsRouteSteps: mockPaymentsRouteStepRepository,
      transfers: mockTransferRepository,
      transferErrors: mockTransferErrorRepository,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentDomainService,
        {
          provide: PaymentDataService,
          useValue: dataService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    paymentDomainService = module.get<PaymentDomainService>(PaymentDomainService);
    paymentDataService = module.get<PaymentDataService>(PaymentDataService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Account Management', () => {
    it('should add a payment account', async () => {
      const accountInput: DeepPartial<IPaymentAccount> = {
        type: PaymentAccountType.BankAccount,
        provider: PaymentAccountProviderCodes.Checkbook,
        accountHolderName: 'John Smith',
        accountNumber: '1234567890',
        routingNumber: '123456789',
      };
      
      const result = await paymentDomainService.addPaymentAccount(mockUserId, accountInput);
      
      expect(result).toBeDefined();
      expect(mockPaymentAccountRepository.createPaymentAccount).toHaveBeenCalledWith({
        ...accountInput,
        userId: mockUserId,
      });
      expect(result.userId).toBe(mockUserId);
    });

    it('should get a payment account by ID', async () => {
      const result = await paymentDomainService.getPaymentAccountById(mockSourceAccountId);
      
      expect(result).toBeDefined();
      expect(mockPaymentAccountRepository.getPaymentAccountById).toHaveBeenCalledWith(
        mockSourceAccountId,
        undefined
      );
      expect(result.id).toBe(mockSourceAccountId);
    });

    it('should return null when account is not found', async () => {
      mockPaymentAccountRepository.getPaymentAccountById.mockResolvedValueOnce(null);
      
      const result = await paymentDomainService.getPaymentAccountById('non-existent-account');
      
      expect(result).toBeNull();
    });
  });

  describe('Loan Management', () => {
    it('should get a loan by ID', async () => {
      const result = await paymentDomainService.getLoanById(mockLoanId);
      
      expect(result).toBeDefined();
      expect(mockLoanRepository.getLoanById).toHaveBeenCalledWith(mockLoanId, undefined);
      expect(result.id).toBe(mockLoanId);
    });

    it('should return null when loan is not found', async () => {
      mockLoanRepository.getLoanById.mockResolvedValueOnce(null);
      
      const result = await paymentDomainService.getLoanById('non-existent-loan');
      
      expect(result).toBeNull();
    });
  });

  describe('Payment Management', () => {
    it('should get a loan payment by ID', async () => {
      const result = await paymentDomainService.getLoanPaymentById(mockPaymentId);
      
      expect(result).toBeDefined();
      expect(mockLoanPaymentRepository.getPaymentById).toHaveBeenCalledWith(mockPaymentId, undefined);
      expect(result.id).toBe(mockPaymentId);
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
      expect(mockLoanPaymentRepository.createPayment).toHaveBeenCalledWith(paymentInput);
      expect(result.amount).toBe(500);
      expect(result.type).toBe(LoanPaymentTypeCodes.Repayment);
    });

    it('should update a payment', async () => {
      const updates: DeepPartial<ILoanPayment> = {
        state: LoanPaymentStateCodes.Pending,
      };
      
      const result = await paymentDomainService.updatePayment(mockPaymentId, updates);
      
      expect(result).toBe(true);
      expect(mockLoanPaymentRepository.updatePayment).toHaveBeenCalledWith(mockPaymentId, updates);
    });

    it('should complete a payment', async () => {
      const result = await paymentDomainService.completePayment(mockPaymentId);
      
      expect(result).toBe(true);
      expect(mockLoanPaymentRepository.updatePayment).toHaveBeenCalledWith(
        mockPaymentId,
        expect.objectContaining({
          state: LoanPaymentStateCodes.Completed,
          completedAt: expect.any(Date),
        })
      );
    });

    it('should fail a payment', async () => {
      const result = await paymentDomainService.failPayment(mockPaymentId, mockStepId);
      
      expect(result).toBe(true);
      expect(mockLoanPaymentRepository.updatePayment).toHaveBeenCalledWith(
        mockPaymentId,
        {
          state: LoanPaymentStateCodes.Failed,
        }
      );
    });

    it('should save a repayment plan', async () => {
      const planItems: PlanPreviewOutputItem[] = [
        {
          index: 0,
          amount: 100,
          paymentDate: new Date(),
          principal: 90,
          interest: 10,
        },
        {
          index: 1,
          amount: 100,
          paymentDate: new Date(),
          principal: 95,
          interest: 5,
        },
      ];
      
      const result = await paymentDomainService.saveRepaymentPlan(planItems, mockLoanId);
      
      expect(result).toBeDefined();
      expect(mockLoanPaymentRepository.createPayments).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            amount: 100,
            loanId: mockLoanId,
            paymentNumber: 1,
            type: LoanPaymentTypeCodes.Repayment,
            state: LoanPaymentStateCodes.Created,
          }),
          expect.objectContaining({
            amount: 100,
            loanId: mockLoanId,
            paymentNumber: 2,
            type: LoanPaymentTypeCodes.Repayment,
            state: LoanPaymentStateCodes.Created,
          }),
        ])
      );
      expect(result).toHaveLength(2);
    });

    it('should return null for empty repayment plan', async () => {
      const result = await paymentDomainService.saveRepaymentPlan([], mockLoanId);
      
      expect(result).toBeNull();
      expect(mockLoanPaymentRepository.createPayments).not.toHaveBeenCalled();
    });
  });

  describe('Payment Route Finding', () => {
    it('should find a route for payment', async () => {
      const result = await paymentDomainService.findRouteForPayment(
        mockSourceAccountId,
        mockDestinationAccountId,
        LoanPaymentTypeCodes.Funding,
        LoanTypeCodes.P2p
      );
      
      expect(result).toBeDefined();
      expect(mockPaymentAccountRepository.getPaymentAccountById).toHaveBeenCalledWith(mockSourceAccountId);
      expect(mockPaymentAccountRepository.getPaymentAccountById).toHaveBeenCalledWith(mockDestinationAccountId);
      expect(mockPaymentsRouteRepository.findRoute).toHaveBeenCalledWith(
        expect.objectContaining({
          fromAccount: PaymentAccountType.BankAccount,
          fromOwnership: PaymentAccountOwnershipType.Personal,
          fromProvider: PaymentAccountProviderCodes.Checkbook,
          toAccount: PaymentAccountType.BankAccount,
          toOwnership: PaymentAccountOwnershipType.Internal,
          toProvider: PaymentAccountProviderCodes.Fiserv,
          loanStage: LoanPaymentTypeCodes.Funding,
          loanType: LoanTypeCodes.P2p,
        }),
        expect.arrayContaining([PAYMENTS_ROUTE_RELATIONS.Steps])
      );
      expect(result.id).toBe(mockRouteId);
    });

    it('should return null when source account is not found', async () => {
      mockPaymentAccountRepository.getPaymentAccountById.mockImplementationOnce(async () => null);
      
      const result = await paymentDomainService.findRouteForPayment(
        'non-existent-account',
        mockDestinationAccountId,
        LoanPaymentTypeCodes.Funding,
        LoanTypeCodes.P2p
      );
      
      expect(result).toBeNull();
      expect(mockPaymentsRouteRepository.findRoute).not.toHaveBeenCalled();
    });

    it('should return null when destination account is not found', async () => {
      mockPaymentAccountRepository.getPaymentAccountById
        .mockImplementationOnce(async () => mockPaymentAccount)
        .mockImplementationOnce(async () => null);
      
      const result = await paymentDomainService.findRouteForPayment(
        mockSourceAccountId,
        'non-existent-account',
        LoanPaymentTypeCodes.Funding,
        LoanTypeCodes.P2p
      );
      
      expect(result).toBeNull();
      expect(mockPaymentsRouteRepository.findRoute).not.toHaveBeenCalled();
    });
  });

  describe('Payment Step Management', () => {
    it('should get a loan payment step by ID', async () => {
      const result = await paymentDomainService.getLoanPaymentStepById(mockStepId);
      
      expect(result).toBeDefined();
      expect(mockLoanPaymentStepRepository.getStepById).toHaveBeenCalledWith(mockStepId, undefined);
      expect(result.id).toBe(mockStepId);
    });

    it('should create payment steps', async () => {
      const stepInputs: DeepPartial<ILoanPaymentStep>[] = [
        {
          loanPaymentId: mockPaymentId,
          order: 0,
          amount: 500,
          sourcePaymentAccountId: mockSourceAccountId,
          targetPaymentAccountId: mockDestinationAccountId,
          state: PaymentStepStateCodes.Created,
        },
        {
          loanPaymentId: mockPaymentId,
          order: 1,
          amount: 500,
          sourcePaymentAccountId: mockSourceAccountId,
          targetPaymentAccountId: mockDestinationAccountId,
          state: PaymentStepStateCodes.Created,
        },
      ];
      
      const result = await paymentDomainService.createPaymentSteps(stepInputs);
      
      expect(result).toBeDefined();
      expect(mockLoanPaymentStepRepository.createPaymentSteps).toHaveBeenCalledWith(stepInputs);
      expect(result).toHaveLength(2);
    });

    it('should update a payment step state', async () => {
      const result = await paymentDomainService.updatePaymentStepState(
        mockStepId,
        PaymentStepStateCodes.Pending
      );
      
      expect(result).toBe(true);
      expect(mockLoanPaymentStepRepository.updateStepState).toHaveBeenCalledWith(
        mockStepId,
        PaymentStepStateCodes.Pending
      );
    });

    it('should get the latest transfer for a step', async () => {
      const result = await paymentDomainService.getLatestTransferForStep(mockStepId);
      
      expect(result).toBeDefined();
      expect(mockTransferRepository.getLatestTransferForStep).toHaveBeenCalledWith(mockStepId);
      expect(result.id).toBe(mockTransferId);
    });

    it('should throw MissingInputException when step ID is missing', async () => {
      await expect(paymentDomainService.getLoanPaymentStepById('')).rejects.toThrow(MissingInputException);
      await expect(paymentDomainService.getLoanPaymentStepById(null as unknown as string)).rejects.toThrow(MissingInputException);
    });

    it('should throw EntityNotFoundException when step is not found', async () => {
      mockLoanPaymentStepRepository.getStepById.mockResolvedValueOnce(null);
      
      await expect(paymentDomainService.getLoanPaymentStepById('non-existent-step'))
        .rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('Transfer Management', () => {
    it('should create a transfer for a step', async () => {
      const result = await paymentDomainService.createTransferForStep(mockStepId);
      
      expect(result).toBeDefined();
      expect(mockLoanPaymentStepRepository.getStepById).toHaveBeenCalledWith(
        mockStepId,
        [LOAN_PAYMENT_STEP_RELATIONS.Transfers]
      );
      expect(mockTransferRepository.createTransferForStep).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 1000,
          state: TransferStateCodes.Created,
          sourceAccountId: mockSourceAccountId,
          destinationAccountId: mockDestinationAccountId,
          order: 0,
          loanPaymentStepId: mockStepId,
        })
      );
      expect(result.id).toBe(mockTransferId);
    });

    it('should get a transfer by ID', async () => {
      const result = await paymentDomainService.getTransferById(mockTransferId);
      
      expect(result).toBeDefined();
      expect(mockTransferRepository.getTransferById).toHaveBeenCalledWith(mockTransferId, undefined);
      expect(result.id).toBe(mockTransferId);
    });

    it('should throw MissingInputException when transfer ID is missing', async () => {
      await expect(paymentDomainService.getTransferById('')).rejects.toThrow(MissingInputException);
      await expect(paymentDomainService.getTransferById(null as unknown as string)).rejects.toThrow(MissingInputException);
    });

    it('should throw EntityNotFoundException when transfer is not found', async () => {
      mockTransferRepository.getTransferById.mockResolvedValueOnce(null);
      
      await expect(paymentDomainService.getTransferById('non-existent-transfer'))
        .rejects.toThrow(EntityNotFoundException);
    });

    it('should throw MissingInputException when step ID is missing for transfer creation', async () => {
      await expect(paymentDomainService.createTransferForStep('')).rejects.toThrow(MissingInputException);
      await expect(paymentDomainService.createTransferForStep(null as unknown as string)).rejects.toThrow(MissingInputException);
    });
  });
});
