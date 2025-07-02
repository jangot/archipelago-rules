import { LoanPaymentType, LoanType, PaymentAccountOwnershipType, PaymentAccountProvider, PaymentAccountType } from '@library/entity/enum';

export interface PaymentRouteSearchInput {
  /** Source account type ('debit_card' | 'bank_account' | 'biller_network') */
  fromAccount: PaymentAccountType;
  /** Source account ownership ('personal' | 'internal' | 'external') */
  fromOwnership: PaymentAccountOwnershipType;
  /** Source account provider ('checkbook' | 'fiserv' | 'tabapay') */
  fromProvider: PaymentAccountProvider;
    
  /** Destination account type ('debit_card' | 'bank_account' | 'biller_network') */
  toAccount: PaymentAccountType;    
  /** Destination account ownership ('personal' | 'internal' | 'external') */
  toOwnership: PaymentAccountOwnershipType;    
  /** Destination account provider ('checkbook' | 'fiserv' | 'tabapay') */
  toProvider: PaymentAccountProvider;
    
  /** 
         * Supported loan stages ('funding' | 'disbursement' | 'fee' | 'repayment' | 'refund')
         * @todo Use GIN Index for this field?
         */
  loanStage: LoanPaymentType;
  /** 
         * Supported loan types ('dbp' | 'p2p' | 'rr')
         * @todo Use GIN Index for this field?
         */
  loanType: LoanType;
    
}
