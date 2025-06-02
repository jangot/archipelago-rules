import { Injectable, Logger } from '@nestjs/common';
import { LoanPaymentType, LoanPaymentTypeCodes } from '@library/entity/enum';
import { Loan } from '../../../../../libs/shared/src/domain/entities/loan.entity';

/**
 * Service responsible for determining payment routes based on loan types and configurations
 * This is a placeholder implementation that would need to be replaced with actual routing logic
 */
@Injectable()
export class PaymentRouteService {
  private readonly logger: Logger = new Logger(PaymentRouteService.name);

  /**
   * Gets the appropriate payment route ID for a loan payment
   * @param loan The loan for which to determine a route
   * @param paymentType The type of payment (funding, disbursement, etc.)
   * @returns The ID of the determined payment route
   */
  public async getRouteId(loan: Loan, paymentType: LoanPaymentType): Promise<string> {
    // This is a placeholder implementation
    // In a real implementation, this would look up routes in the database
    // based on source/target account types, loan type, payment type, etc.
    
    this.logger.log(`Determining route for ${paymentType} payment on loan ${loan.id}`);
    
    // Simulated logic based on loan type and payment type
    const routePrefix = this.getRoutePrefix(loan, paymentType);
    
    // Generate a mock route ID
    const routeId = `${routePrefix}-route-${Date.now()}`;
    
    this.logger.log(`Selected route ${routeId} for ${paymentType} payment on loan ${loan.id}`);
    return routeId;
  }

  /**
   * Gets a route prefix based on loan type and payment type
   * @param loan The loan to get a route prefix for
   * @param paymentType The type of payment
   * @returns A route prefix string
   */
  private getRoutePrefix(loan: Loan, paymentType: LoanPaymentType): string {
    // In a real implementation, this would determine the appropriate route
    // based on the loan type, payment type, and account configurations
    
    switch (paymentType) {
      case LoanPaymentTypeCodes.Funding:
        return 'funding';
      
      case LoanPaymentTypeCodes.Disbursement:
        return 'disbursement';
      
      case LoanPaymentTypeCodes.Repayment:
        return 'repayment';
      
      case LoanPaymentTypeCodes.Fee:
        return 'fee';
      
      case LoanPaymentTypeCodes.Refund:
        return 'refund';
      
      default:
        throw new Error(`Unsupported payment type: ${paymentType}`);
    }
  }
}
