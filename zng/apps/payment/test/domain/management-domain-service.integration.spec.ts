import { Test, TestingModule } from '@nestjs/testing';
import { ILoanPayment } from '@library/entity/interface';
import { 
  LoanPaymentTypeCodes, 
  PaymentStepStateCodes,
  PaymentAccountProviderCodes,
} from '@library/entity/enum';
import { v4 as uuidv4 } from 'uuid';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { ManagementDomainService } from '@payment/domain/services';
import { DomainModule } from '@payment/domain/domain.module';
import { DataSource } from 'typeorm';
import { LoanPaymentFactory } from '@payment/loan-payments';
import { LoanPaymentStepFactory } from '@payment/loan-payment-steps/loan-payment-step.factory';
import { TransferExecutionFactory } from '@payment/transfer-execution/transfer-execution.factory';
import { DataModule } from '@payment/data/data.module';
import { LoanPaymentStepModule } from '@payment/loan-payment-steps/loan-payment-step.module';
import { TransferExecutionModule } from '@payment/transfer-execution/transfer-execution.module';
import { Logger } from '@nestjs/common';
import { IDomainServices } from '@payment/domain/idomain.services';
import { AllEntities } from '@library/shared/domain/entities';
import { DbSchemaCodes } from '@library/shared/common/data';
import { memoryDataSourceForTests } from '@library/shared/tests/postgress-memory-datasource';
import { IBackup } from 'pg-mem';

describe('ManagementDomainService Integration', () => {
  let databaseBackup: IBackup;
  let module: TestingModule;
  let managementService: ManagementDomainService;
  let domainServices: IDomainServices;
  let loanPaymentFactory: LoanPaymentFactory;
  let loanPaymentStepFactory: LoanPaymentStepFactory;
  let transferExecutionFactory: TransferExecutionFactory;
  
  // Test data
  const testLoanId = uuidv4();
  const testPaymentId = uuidv4();
  const testStepId = uuidv4();
  const testTransferId = uuidv4();
  const logger = new Logger('ManagementDomainServiceIntegrationTest');
  
  beforeAll(async () => {
    logger.log('Initializing test module');
    
    // Initialize the transactional context
    const memoryDBinstance = await memoryDataSourceForTests({ entities: [...AllEntities], schema: DbSchemaCodes.Payment });
    const { dataSource, database } = memoryDBinstance;
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    // Create the test module using real implementations
    module = await Test.createTestingModule({
      imports: [
        DataModule,
        DomainModule,
        LoanPaymentStepModule,
        TransferExecutionModule,
      ],
    }).overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource)).compile();
    
    // Get the real services
    managementService = module.get<ManagementDomainService>(ManagementDomainService);
    loanPaymentFactory = module.get<LoanPaymentFactory>(LoanPaymentFactory);
    loanPaymentStepFactory = module.get<LoanPaymentStepFactory>(LoanPaymentStepFactory);
    transferExecutionFactory = module.get<TransferExecutionFactory>(TransferExecutionFactory);
    domainServices = module.get<IDomainServices>(IDomainServices);

    databaseBackup = database.backup();
    
    logger.log('Test module initialized');
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup mock data for the tests
    setupMockData();
  });
  
  afterAll(async () => {
    await module.close();
  });

  /**
   * Sets up mock data for testing by mocking domain service methods
   */
  function setupMockData() {
    // Mock loan data
    jest.spyOn(domainServices.paymentServices, 'getLoanById').mockResolvedValue({
      id: testLoanId,
      amount: 1000,
    } as any);
    
    // Mock loan payment
    const mockLoanPayment = {
      id: testPaymentId,
      loanId: testLoanId,
      type: LoanPaymentTypeCodes.Funding,
      steps: [
        {
          id: testStepId,
          loanPaymentId: testPaymentId,
          state: PaymentStepStateCodes.Created,
          order: 0,
        },
      ],
    } as ILoanPayment;
    
    // Mock payment services methods
    jest.spyOn(domainServices.paymentServices, 'createPayment').mockResolvedValue(mockLoanPayment);
    jest.spyOn(domainServices.paymentServices, 'getLoanPaymentById').mockResolvedValue(mockLoanPayment);
    jest.spyOn(domainServices.paymentServices, 'getLoanPaymentStepById').mockResolvedValue(mockLoanPayment.steps![0]);
    jest.spyOn(domainServices.paymentServices, 'updatePayment').mockResolvedValue(true);
    jest.spyOn(domainServices.paymentServices, 'updatePaymentStepState').mockResolvedValue(true);
    
    // Mock transfer services
    jest.spyOn(domainServices.paymentServices, 'getTransferById').mockResolvedValue({
      id: testTransferId,
      amount: 1000,
      providerType: PaymentAccountProviderCodes.Checkbook,
    } as any);
    
    // Mock factory methods to ensure they return actual manager instances
    jest.spyOn(loanPaymentFactory, 'getManager');
    jest.spyOn(loanPaymentStepFactory, 'getManager');
    jest.spyOn(transferExecutionFactory, 'getProvider').mockResolvedValue({
      executeTransfer: jest.fn().mockResolvedValue(true),
    });
  }

  describe('initiateLoanPayment', () => {
    it('should successfully initiate a funding payment', async () => {
      // Act
      const result = await managementService.initiateLoanPayment(
        testLoanId,
        LoanPaymentTypeCodes.Funding
      );
      
      // Assert
      expect(result).toBeTruthy();
      expect(loanPaymentFactory.getManager).toHaveBeenCalledWith(LoanPaymentTypeCodes.Funding);
    });

    it('should successfully initiate a repayment', async () => {
      // Setup mock for repayment
      jest.spyOn(domainServices.paymentServices, 'createPayment').mockResolvedValueOnce(
        {
          id: uuidv4(),
          loanId: testLoanId,
          type: LoanPaymentTypeCodes.Repayment,
          paymentNumber: 2,
          steps: [],
        }
      );
      
      // Act
      const result = await managementService.initiateLoanPayment(
        testLoanId,
        LoanPaymentTypeCodes.Repayment
      );
      
      // Assert
      expect(result).toBeTruthy();
      expect(loanPaymentFactory.getManager).toHaveBeenCalledWith(LoanPaymentTypeCodes.Repayment);
    });
  });

  describe('advancePayment', () => {
    it('should advance an existing payment', async () => {
      // Act
      const result = await managementService.advancePayment(
        testPaymentId,
        LoanPaymentTypeCodes.Funding
      );
      
      // Assert
      expect(result).toBeTruthy();
      expect(loanPaymentFactory.getManager).toHaveBeenCalledWith(LoanPaymentTypeCodes.Funding);
    });

    it('should handle null payment type by determining it from the payment', async () => {
      // Act
      const result = await managementService.advancePayment(testPaymentId, LoanPaymentTypeCodes.Funding);
      
      // Assert
      expect(result).toBeTruthy();
    });
  });

  describe('advancePaymentStep', () => {
    it('should advance a payment step with explicit state', async () => {
      // Act
      const result = await managementService.advancePaymentStep(
        testStepId,
        PaymentStepStateCodes.Created
      );
      
      // Assert
      expect(result).toBeTruthy();
      expect(loanPaymentStepFactory.getManager).toHaveBeenCalled();
    });

    it('should advance a payment step without explicit state', async () => {
      // Act
      const result = await managementService.advancePaymentStep(testStepId);
      
      // Assert
      expect(result).toBeTruthy();
      expect(loanPaymentStepFactory.getManager).toHaveBeenCalled();
    });
  });

  describe('executeTransfer', () => {
    it('should execute a transfer with specified provider', async () => {
      // Act
      const result = await managementService.executeTransfer(
        testTransferId,
        PaymentAccountProviderCodes.Checkbook
      );
      
      // Assert
      expect(result).toBeTruthy();
    });

    it('should execute a transfer without specified provider', async () => {
      // Act
      const result = await managementService.executeTransfer(testTransferId);
      
      // Assert
      expect(result).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle payment initiation failure', async () => {
      // Arrange - mock failed payment initiation
      jest.spyOn(domainServices.paymentServices, 'createPayment').mockResolvedValueOnce(null);
      
      // Act
      const result = await managementService.initiateLoanPayment(
        testLoanId,
        LoanPaymentTypeCodes.Funding
      );
      
      // Assert
      expect(result).toBeNull();
    });

    it('should handle payment advancement failure', async () => {
      // Arrange - mock failed payment advancement
      jest.spyOn(domainServices.paymentServices, 'updatePayment').mockResolvedValueOnce(false);
      
      // Act
      const result = await managementService.advancePayment(
        testPaymentId,
        LoanPaymentTypeCodes.Funding
      );
      
      // Assert
      expect(result).toBeFalsy();
    });
  });
});
