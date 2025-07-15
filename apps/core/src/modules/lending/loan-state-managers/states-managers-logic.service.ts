import { ILoan, ILoanPayment } from '@library/entity/entity-interface';
import { LoanPaymentStateCodes, LoanPaymentType, LoanPaymentTypeCodes, LoanState, LoanStateCodes, PaymentAccountStateCodes } from '@library/entity/enum';

/**
 * Static utility service for loan state management logic
 * Contains pure functions for evaluating loan and payment states without dependencies
 */
export class StatesManagersLogic {
  /**
   * Checks if a payment is completed
   * @param loan - The loan to evaluate
   * @param paymentType - The type of payment to check
   * @returns True if payment is completed
   */
  public static isPaymentCompleted(loan: ILoan, paymentType: LoanPaymentType): boolean {
    const relevantPayment = this.getStateEvaluationPayment(loan, paymentType);
    if (!relevantPayment) {
      return false;
    }
    return relevantPayment.state === LoanPaymentStateCodes.Completed;
  }

  /**
   * Checks if a payment has failed
   * @param loan - The loan to evaluate
   * @param paymentType - The type of payment to check
   * @returns True if payment has failed
   */
  public static isPaymentFailed(loan: ILoan, paymentType: LoanPaymentType): boolean {
    const relevantPayment = this.getStateEvaluationPayment(loan, paymentType);
    if (!relevantPayment) {
      return false;
    }
    return relevantPayment.state === LoanPaymentStateCodes.Failed;
  }

  /**
   * Checks if a payment is pending
   * @param loan - The loan to evaluate
   * @param paymentType - The type of payment to check
   * @returns True if payment is pending
   */
  public static isPaymentPending(loan: ILoan, paymentType: LoanPaymentType): boolean {
    const relevantPayment = this.getStateEvaluationPayment(loan, paymentType);
    if (!relevantPayment) {
      return false;
    }
    return relevantPayment.state === LoanPaymentStateCodes.Pending;
  }

  /**
   * Determines if the current payment is the last payment for the loan
   * @param loan - The loan entity with payment information
   * @param paymentType - The primary payment type for the current state
   * @returns True if this is the last payment, false otherwise
   */
  public static isLastPayment(loan: ILoan, paymentType: LoanPaymentType): boolean {
    const { paymentsCount } = loan;
    const currentPayment = this.getStateEvaluationPayment(loan, paymentType, true);
    if (!currentPayment) {
      return false;
    }
    return paymentsCount === currentPayment.paymentNumber;
  }

  /**
   * Retrieves the latest payment of a specific type for a loan, used for state evaluation
   * @param loan - The loan object containing payment information
   * @param paymentType - The type of payment to evaluate
   * @param sortByOrder - Optional flag to sort by paymentNumber instead of createdAt
   * @returns The latest payment of the specified type or null if none found
   */
  public static getStateEvaluationPayment(
    loan: ILoan,
    paymentType: LoanPaymentType,
    sortByOrder = false
  ): ILoanPayment | null {
    const { payments } = loan;

    // Check that there are any payments at all
    if (!payments || !payments.length) {
      return null;
    }

    // Filter payments by type and find the latest one
    const typePayments = payments.filter(p => p.type === paymentType);
    if (!typePayments || !typePayments.length) {
      return null;
    }

    // Default scenario - return the latest payment of the specified type
    if (typePayments.length === 1) {
      return typePayments[0];
    }

    // Multiple payments of the same type
    // Return the one with the latest createdAt date by default
    // If sortByOrder is true, return by highest paymentNumber instead
    if (sortByOrder) {
      return typePayments.reduce((latest, current) => {
        return (current.paymentNumber && latest.paymentNumber && current.paymentNumber > latest.paymentNumber) ? current : latest;
      });
    }

    return typePayments.reduce((latest, current) => {
      return (current.createdAt > latest.createdAt) ? current : latest;
    });
  }

  /**
   * Gets the primary payment type associated with a loan state
   * @param loanState - The loan state to get payment type for
   * @returns The primary payment type for this state
   */
  public static getPrimaryPaymentType(loanState: LoanState): LoanPaymentType {
    switch (loanState) {
      case LoanStateCodes.Accepted:
      case LoanStateCodes.Funding:
      case LoanStateCodes.FundingPaused:
      case LoanStateCodes.Funded:
        return LoanPaymentTypeCodes.Funding;
      case LoanStateCodes.Disbursing:
      case LoanStateCodes.DisbursingPaused:
      case LoanStateCodes.Disbursed:
        return LoanPaymentTypeCodes.Disbursement;
      case LoanStateCodes.Repaying:
      case LoanStateCodes.RepaymentPaused:
      case LoanStateCodes.Repaid:
      case LoanStateCodes.Closed:
        return LoanPaymentTypeCodes.Repayment;
      default:
        throw new Error(`Unsupported loan state: ${loanState}`);
    }
  }

  /**
   * Gets the supported next states for a loan state from configuration
   * @param loanState - The current loan state
   * @returns Array of supported loan states this state can transition to
   */
  public static getSupportedNextStates(loanState: LoanState): LoanState[] {
    switch (loanState) {
      case LoanStateCodes.Accepted:
        return [LoanStateCodes.Funding];
      case LoanStateCodes.Funding:
        return [LoanStateCodes.Funded, LoanStateCodes.FundingPaused, LoanStateCodes.Accepted];
      case LoanStateCodes.FundingPaused:
        return [LoanStateCodes.Funded, LoanStateCodes.Accepted, LoanStateCodes.Funding];
      case LoanStateCodes.Funded:
        return [LoanStateCodes.Accepted, LoanStateCodes.Disbursing];
      case LoanStateCodes.Disbursing:
        return [LoanStateCodes.Disbursed, LoanStateCodes.DisbursingPaused, LoanStateCodes.Funded];
      case LoanStateCodes.DisbursingPaused:
        return [LoanStateCodes.Disbursed, LoanStateCodes.Funded, LoanStateCodes.Disbursing];
      case LoanStateCodes.Disbursed:
        return [LoanStateCodes.Funded, LoanStateCodes.Repaying];
      case LoanStateCodes.Repaying:
        return [LoanStateCodes.Repaid, LoanStateCodes.RepaymentPaused, LoanStateCodes.Closed];
      case LoanStateCodes.RepaymentPaused:
        return [LoanStateCodes.Repaying, LoanStateCodes.Closed, LoanStateCodes.Repaid];
      case LoanStateCodes.Repaid:
        return [LoanStateCodes.Closed];
      case LoanStateCodes.Closed:
      default:
        return [];
    }
  }

  /**
   * Validates that a loan is in the expected state
   * @param loan - The loan entity to validate
   * @param expectedState - The expected loan state
   * @returns True if the loan is in the expected state, false otherwise
   */
  public static isActualStateValid(loan: ILoan, expectedState: LoanState): boolean {
    return loan.state === expectedState;
  }

  /**
   * Validates if a loan has valid payment accounts connected
   * @param loan - The loan entity to validate
   * @returns True if all prerequisites are met, false otherwise
   */
  public static hasValidAccountsConnected(loan: ILoan): boolean {
    const { billerId, lenderId, borrowerId, biller, lenderAccountId, borrowerAccountId, lenderAccount, borrowerAccount } = loan;
  
    // Validate biller existence
    if (!biller) {
      return false;
    }
  
    // Validate payment accounts existence
    if (!lenderAccount || !borrowerAccount || !biller.paymentAccount) {
      return false;
    }
  
    const { paymentAccountId: billerAccountId } = biller;
    const requiredIds = [billerId, lenderId, borrowerId, billerAccountId, lenderAccountId, borrowerAccountId];
      
    // Check all required IDs are present
    if (requiredIds.some(id => id === null || id === undefined)) {
      return false;
    }
  
    // Validate payment account states
    const isLenderAccountVerified = lenderAccount.state === PaymentAccountStateCodes.Verified;
    const isBorrowerAccountVerified = borrowerAccount.state === PaymentAccountStateCodes.Verified;
    const isBillerAccountVerified = biller.paymentAccount.state === PaymentAccountStateCodes.Verified;
  
    return isLenderAccountVerified && isBorrowerAccountVerified && isBillerAccountVerified;
  }
}
