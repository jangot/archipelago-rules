import { PaymentAccountDetailsType } from '@library/entity/enum/payment-account.details.type';

export interface PaymentAccountDetailsBase {
  readonly type: PaymentAccountDetailsType;
  displayName: string;
}

export interface TabapayPaymentAccountDetails extends PaymentAccountDetailsBase {
  readonly type: 'tabapay';
}

export interface FiservDebitAccountDetails extends PaymentAccountDetailsBase {
  readonly type: 'fiserv_debit';
  cardToken: string;
  cardExpiration: string;
  last4Digits: string;    
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
    CheckbookAchAccountDetails | 
    CheckbookAchPlaidLinkAccountDetails;
