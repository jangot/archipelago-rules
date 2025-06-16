import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';

import { Test, TestingModule } from '@nestjs/testing';
import { DataModule } from '../../src/data/data.module';
import { DomainModule } from '../../src/domain/domain.module';
import { LoanPaymentModule } from '../../src/loan-payments/loan-payment.module';
import { IDomainServices } from '../../src/domain/idomain.services';
import { LoanPaymentFactory } from '../../src/loan-payments/loan-payment.factory';
import { 
  FundingPaymentManager,
  DisbursementPaymentManager,
  RepaymentPaymentManager,
  FeePaymentManager,
  RefundPaymentManager,
} from '../../src/loan-payments/managers';
import { 
  LoanPaymentTypeCodes, 
} from '@library/entity/enum';
import { LoanPaymentStepModule } from '../../src/loan-payment-steps/loan-payment-step.module';
import { TransferExecutionModule } from '../../src/transfer-execution/transfer-execution.module';
import { memoryDataSourceForTests } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entities';
import { DbSchemaCodes } from '@library/shared/common/data';

describe('Loan Payment Managers Integration', () => {
  let module: TestingModule;
  let domainServices: IDomainServices;
  let loanPaymentFactory: LoanPaymentFactory;
  let databaseBackup: IBackup;

  // Test data
  const mockLoanId = uuidv4();
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
        LoanPaymentModule, // Loan payment module
        LoanPaymentStepModule, // Loan payment step module
        TransferExecutionModule, // Transfer execution module
      ],
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    domainServices = module.get<IDomainServices>(IDomainServices);
    loanPaymentFactory = module.get<LoanPaymentFactory>(LoanPaymentFactory);
    
    databaseBackup = database.backup();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    // Restore database to clean state before each test
    databaseBackup.restore();
  });

  describe('LoanPaymentFactory', () => {
    it('should get funding payment manager for funding type', () => {
      const manager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      
      expect(manager).toBeInstanceOf(FundingPaymentManager);
    });

    it('should get disbursement payment manager for disbursement type', () => {
      const manager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);
      
      expect(manager).toBeInstanceOf(DisbursementPaymentManager);
    });

    it('should get repayment payment manager for repayment type', () => {
      const manager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      
      expect(manager).toBeInstanceOf(RepaymentPaymentManager);
    });

    it('should get fee payment manager for fee type', () => {
      const manager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      
      expect(manager).toBeInstanceOf(FeePaymentManager);
    });

    it('should get refund payment manager for refund type', () => {
      const manager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      
      expect(manager).toBeInstanceOf(RefundPaymentManager);
    });

    it('should throw error for unsupported payment type', () => {
      expect(() => {
        loanPaymentFactory.getManager('unsupported' as any);
      }).toThrow();
    });
  });

  describe('FundingPaymentManager', () => {
    it('should initiate funding payment for loan', async () => {
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      const result = await fundingManager.initiate(mockLoanId);
      
      // Since no loan exists in test database, expect null
      expect(result).toBeNull();
    });

    it('should advance funding payment', async () => {
      const fundingManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Funding);
      const result = await fundingManager.advance(mockPaymentId);
      
      // Since no payment exists in test database, expect null
      expect(result).toBeNull();
    });

    it('should have domain services configured', () => {
      // Verify domainServices is properly injected
      expect(domainServices).toBeDefined();
      expect(domainServices.paymentServices).toBeDefined();
      // ManagementDomainService is no longer part of IDomainServices
      // It's now accessed directly from ManagementModule
    });
  });

  describe('DisbursementPaymentManager', () => {
    it('should initiate disbursement payment for loan', async () => {
      const disbursementManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);
      const result = await disbursementManager.initiate(mockLoanId);
      
      // Since no loan exists in test database, expect null
      expect(result).toBeNull();
    });

    it('should advance disbursement payment', async () => {
      const disbursementManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Disbursement);
      const result = await disbursementManager.advance(mockPaymentId);
      
      // Since no payment exists in test database, expect null
      expect(result).toBeNull();
    });
  });

  describe('RepaymentPaymentManager', () => {
    it('should initiate repayment payments for loan', async () => {
      const repaymentManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      const result = await repaymentManager.initiate(mockLoanId);
      
      // Since no loan exists in test database, expect null
      expect(result).toBeNull();
    });

    it('should advance repayment payment', async () => {
      const repaymentManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Repayment);
      const result = await repaymentManager.advance(mockPaymentId);
      
      // Since no payment exists in test database, expect null
      expect(result).toBeNull();
    });
  });

  describe('FeePaymentManager', () => {
    it('should initiate fee payment for loan', async () => {
      const feeManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      const result = await feeManager.initiate(mockLoanId);
      
      // Since no loan exists in test database, expect null
      expect(result).toBeNull();
    });

    it('should advance fee payment', async () => {
      const feeManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Fee);
      const result = await feeManager.advance(mockPaymentId);
      
      // Since no payment exists in test database, expect null
      expect(result).toBeNull();
    });
  });

  describe('RefundPaymentManager', () => {
    it('should initiate refund payment for loan', async () => {
      const refundManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      const result = await refundManager.initiate(mockLoanId);
      
      // Since no loan exists in test database, expect null
      expect(result).toBeNull();
    });

    it('should advance refund payment', async () => {
      const refundManager = loanPaymentFactory.getManager(LoanPaymentTypeCodes.Refund);
      const result = await refundManager.advance(mockPaymentId);
      
      // Since no payment exists in test database, expect null
      expect(result).toBeNull();
    });
  });
});
