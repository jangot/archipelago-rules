import { 
  PaymentAccountOwnershipTypeCodes,
  PaymentAccountProviderCodes,
  PaymentAccountStateCodes,
  PaymentAccountTypeCodes,
} from '@library/entity/enum';
import { IPaymentAccount } from '@library/entity/entity-interface';

/**
 * Factory for creating test payment accounts with standardized configurations
 * This reduces boilerplate in integration tests and ensures consistent test data
 */
export class TestPaymentAccountFactory {
  /**
   * Creates a Checkbook ACH bank account for testing
   * 
   * @param displayName - Optional display name for the account
   * @returns Payment account creation request object
   */
  static createCheckbookBankAccount(displayName?: string) {
    const timestamp = Date.now();
    return {
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Checkbook,
      ownership: PaymentAccountOwnershipTypeCodes.Personal,
      state: PaymentAccountStateCodes.Verified,
      details: {
        type: 'checkbook_ach',
        displayName: displayName || `Test Checkbook Account ${timestamp}`,
        key: `test_key_${timestamp}`,
        secret: `test_secret_${timestamp}`,
        accountId: `acc_${timestamp}`,
        institution: 'Test Bank',
        redactedAccountNumber: '****7890',
        routingNumber: '123456789',
      },
    };
  }

  /**
   * Creates a Fiserv debit card account for testing
   * 
   * @param displayName - Optional display name for the account
   * @returns Payment account creation request object
   */
  static createFiservDebitAccount(displayName?: string) {
    const timestamp = Date.now();
    const last4 = String(timestamp).slice(-4);
    return {
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Fiserv,
      ownership: PaymentAccountOwnershipTypeCodes.Internal,
      state: PaymentAccountStateCodes.Verified,
      details: {
        type: 'fiserv_debit',
        displayName: displayName || `Test Fiserv Account ${timestamp}`,
        cardToken: `token_${timestamp}`,
        cardExpiration: '12/25',
        last4Digits: last4,
      },
    };
  }

  /**
   * Creates a Tabapay bank account for testing
   * 
   * @param displayName - Optional display name for the account
   * @returns Payment account creation request object
   */
  static createTabapayBankAccount(displayName?: string) {
    const timestamp = Date.now();
    return {
      type: PaymentAccountTypeCodes.BankAccount,
      provider: PaymentAccountProviderCodes.Tabapay,
      ownership: PaymentAccountOwnershipTypeCodes.Personal,
      state: PaymentAccountStateCodes.Verified,
      details: {
        type: 'tabapay_ach',
        displayName: displayName || `Test Tabapay Account ${timestamp}`,
        accountId: `tabapay_acc_${timestamp}`,
        accessToken: `access_token_${timestamp}`,
        institution: 'Test Credit Union',
        redactedAccountNumber: '****5678',
        routingNumber: '987654321',
      },
    };
  }

  /**
   * Creates a pair of payment accounts (source and destination) for transfer testing
   * 
   * @param userId - The user ID to create accounts for
   * @param domainServices - The domain services to use for account creation
   * @returns Promise resolving to an object with source and destination accounts
   */
  static async createAccountPair(
    userId: string,
    domainServices: any
  ): Promise<{ sourceAccount: IPaymentAccount; destAccount: IPaymentAccount }> {
    const sourceAccount = await domainServices.paymentServices.addPaymentAccount(
      userId,
      TestPaymentAccountFactory.createCheckbookBankAccount('Source Account')
    );

    const destAccount = await domainServices.paymentServices.addPaymentAccount(
      userId,
      TestPaymentAccountFactory.createFiservDebitAccount('Destination Account')
    );

    if (!sourceAccount || !destAccount) {
      throw new Error('Failed to create payment account pair');
    }

    return { sourceAccount, destAccount };
  }

  /**
   * Creates multiple payment accounts for complex testing scenarios
   * 
   * @param userId - The user ID to create accounts for
   * @param domainServices - The domain services to use for account creation
   * @param count - Number of accounts to create (default: 3)
   * @returns Promise resolving to an array of payment accounts
   */
  static async createMultipleAccounts(
    userId: string,
    domainServices: any,
    count: number = 3
  ): Promise<IPaymentAccount[]> {
    const accounts: IPaymentAccount[] = [];
    const factories = [
      TestPaymentAccountFactory.createCheckbookBankAccount,
      TestPaymentAccountFactory.createFiservDebitAccount,
      TestPaymentAccountFactory.createTabapayBankAccount,
    ];

    for (let i = 0; i < count; i++) {
      const factory = factories[i % factories.length];
      const account = await domainServices.paymentServices.addPaymentAccount(
        userId,
        factory(`Test Account ${i + 1}`)
      );

      if (!account) {
        throw new Error(`Failed to create payment account ${i + 1}`);
      }

      accounts.push(account);
    }

    return accounts;
  }
}
