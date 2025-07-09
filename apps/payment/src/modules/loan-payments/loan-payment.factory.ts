import { Injectable, Logger } from '@nestjs/common';
import { LoanPaymentType, LoanPaymentTypeCodes } from '@library/entity/enum';
import { ILoanPaymentFactory, ILoanPaymentManager } from './interfaces';
import { 
  FundingPaymentManager, 
  DisbursementPaymentManager, 
  RepaymentPaymentManager, 
  FeePaymentManager,
  RefundPaymentManager,
} from './managers';

/**
 * Factory that creates appropriate loan payment managers based on loan lifecycle part
 */
@Injectable()
export class LoanPaymentFactory implements ILoanPaymentFactory {
  private readonly logger: Logger = new Logger(LoanPaymentFactory.name);

  constructor(
    private readonly fundingManager: FundingPaymentManager,
    private readonly disbursementManager: DisbursementPaymentManager,
    private readonly repaymentManager: RepaymentPaymentManager,
    private readonly feeManager: FeePaymentManager,
    private readonly refundManager: RefundPaymentManager,
  ) {}

  /**
   * Gets the appropriate loan payment manager for a specific loan lifecycle part
   * @param lifecyclePart The loan lifecycle part (Funding, Disbursement, Repayment, Fee, Refund)
   * @param loanType The type of loan
   * @returns The appropriate loan payment manager for the specified lifecycle part
   * @throws Error if the lifecycle part is unsupported
   */
  public getManager(paymentType: LoanPaymentType): ILoanPaymentManager {
    switch (paymentType) {
      case LoanPaymentTypeCodes.Funding:
        return this.fundingManager;
      
      case LoanPaymentTypeCodes.Disbursement:
        return this.disbursementManager;
      
      case LoanPaymentTypeCodes.Repayment:
        return this.repaymentManager;
      
      case LoanPaymentTypeCodes.Fee:
        return this.feeManager;
      
      case LoanPaymentTypeCodes.Refund:
        return this.refundManager;
      
      default:
        this.logger.error(`Unsupported loan payment type: ${paymentType}`);
        throw new Error(`Unsupported loan payment type: ${paymentType}`);
    }
  }
}
