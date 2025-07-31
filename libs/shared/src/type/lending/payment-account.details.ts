import { PaymentAccountBankVerificationFlow, PersonalPaymentAccountType } from '@library/entity/enum';
import { PaymentAccountDetailsType } from '@library/entity/enum/payment-account.details.type';

export interface PaymentAccountDetailsBase {
  readonly type: PaymentAccountDetailsType;
  displayName: string;
  redactedAccountNumber: string;
}

export interface TabapayPaymentAccountDetails extends PaymentAccountDetailsBase {
  readonly type: 'tabapay';
}

export interface FiservDebitAccountDetails extends PaymentAccountDetailsBase {
  readonly type: 'fiserv_debit';
  cardToken: string;
  cardExpiration: string;
  // TODO: Below are temporary fields, re-visit when Fiserv is fully integrated
  cardHolderName?: string;
  fullCardNumber?: string;
  cvv?: string;
}

export interface FiservAchAccountDetails extends PaymentAccountDetailsBase {
  readonly type: 'fiserv_ach';
  accountToken: string;
  // TODO: Below are temporary fields, re-visit when Fiserv is fully integrated
  routingNumber?: string;
  fullAccountNumber?: string;
  verificationFlow?: PaymentAccountBankVerificationFlow;
}


export interface CheckbookAchBaseDetails {
  key: string;
  secret: string;
  accountId: string;
  institution: string;
  redactedAccountNumber: string;
  routingNumber: string;
}

export interface CheckbookAchPlaidLinkAccountDetails extends PaymentAccountDetailsBase, CheckbookAchBaseDetails {
  readonly type: 'checkbook_ach_plaid_link';
  plaidAccessToken: string;
}

export interface CheckbookAchAccountDetails extends PaymentAccountDetailsBase, CheckbookAchBaseDetails {
  readonly type: 'checkbook_ach';
}

export type PaymentAccountDetails = 
    TabapayPaymentAccountDetails | 
    FiservDebitAccountDetails | 
    FiservAchAccountDetails |
    CheckbookAchAccountDetails | 
    CheckbookAchPlaidLinkAccountDetails;

export interface PersonalPaymentMethodBase {
  readonly type: PersonalPaymentAccountType;
}
    
export interface BankVerificationBase {
  readonly verificationFlow: PaymentAccountBankVerificationFlow;
}
