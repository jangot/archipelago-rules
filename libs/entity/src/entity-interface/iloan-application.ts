import { EntityId } from '@library/shared/common/data/id.entity';
import { LoanType } from '../enum';

export interface ILoanApplication extends EntityId<string> {
  // Loan Application
  id: string;
  status: string | null; //TODO: need to define this. enum?

  // Biller
  billerId: string | null;
  billerName: string | null;
  billerPostalCode: string | null;

  // Bill
  billAccountNumber: string | null;

  // Lender
  lenderId: string | null;
  lenderPaymentAccountId: string | null;
  lenderFirstName: string | null;
  lenderLastName: string | null;
  lenderEmail: string | null;
  lenderRelationship: string | null;
  lenderNote: string | null;
  
  // Borrower
  borrowerId: string | null;
  borrowerPaymentAccountId: string | null;

  // Loan Info
  loanType: LoanType | null;  // p2p, billPay, etc.  //TODO: Need to define this. Change to ILoanType? enum?
  loanPaymentFrequency: string | null; // monthly, weekly, etc. TODO: Need to define this. Change to ILoanPaymentFrequency? enum?
  loanAmount: number | null;
  loanPayments: number | null;
  loanServiceFee: number | null;
}
