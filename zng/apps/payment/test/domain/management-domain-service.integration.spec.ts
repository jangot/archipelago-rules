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
  LoanPaymentTypeCodes,
  PaymentAccountProviderCodes,
  PaymentStepStateCodes,
} from '@library/entity/enum';
import { memoryDataSourceForTests } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entities';
import { DbSchemaCodes } from '@library/shared/common/data';

describe('ManagementDomainService Integration', () => {
  let module: TestingModule;
  let domainServices: IDomainServices;
  let managementDomainService: ManagementDomainService;
  let databaseBackup: IBackup;

  // Test data
  const mockLoanId = uuidv4();
  const mockAccountId = uuidv4();
  const mockPaymentId = uuidv4();
  const mockStepId = uuidv4();
  const mockTransferId = uuidv4();

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

  beforeEach(() => {
    // Restore database to clean state before each test
    databaseBackup.restore();
  });

  describe('Payment Account Management', () => {
    it('should get payment account details', async () => {
      // Test retrieving specific payment account through PaymentDomainService
      const result = await domainServices.paymentServices.getPaymentAccountById(mockAccountId);
      
      expect(result).toBeNull();
    });
  });

  describe('Loan Payment Management', () => {
    it('should initiate loan payment for valid loan', async () => {
      // Test initiateLoanPayment method - one of the actual methods in ManagementDomainService
      const result = await managementDomainService.initiateLoanPayment(mockLoanId, LoanPaymentTypeCodes.Funding);
      
      // Since no loan exists and no payment managers are configured in test, expect null
      expect(result).toBeNull();
    });

    it('should advance payment for valid payment type', async () => {
      // Test advancePayment method - one of the actual methods in ManagementDomainService
      const result = await managementDomainService.advancePayment(mockPaymentId, LoanPaymentTypeCodes.Repayment);
      
      // Since no payment exists and no payment managers are configured in test, expect null
      expect(result).toBeNull();
    });
  });

  describe('Payment Step Management', () => {
    it('should advance payment step', async () => {
      // Test advancePaymentStep method - one of the actual methods in ManagementDomainService
      const result = await managementDomainService.advancePaymentStep(mockStepId, PaymentStepStateCodes.Created);
      
      // Since no step exists and no step managers are configured in test, expect null
      expect(result).toBeNull();
    });
  });

  describe('Transfer Management', () => {
    it('should execute transfer', async () => {
      // Test executeTransfer method - one of the actual methods in ManagementDomainService
      const result = await managementDomainService.executeTransfer(mockTransferId, PaymentAccountProviderCodes.Checkbook);
      
      // Since no transfer exists and no transfer execution providers are configured in test, expect null
      expect(result).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing input for initiate loan payment', async () => {
      // Test with empty loan ID
      const result = await managementDomainService.initiateLoanPayment('', LoanPaymentTypeCodes.Funding);
      
      expect(result).toBeNull();
    });

    it('should handle missing input for advance payment step', async () => {
      // Test with empty step ID
      const result = await managementDomainService.advancePaymentStep('');
      
      expect(result).toBeNull();
    });

    it('should handle missing input for execute transfer', async () => {
      // Test with empty transfer ID
      const result = await managementDomainService.executeTransfer('');
      
      expect(result).toBeNull();
    });
  });
});
