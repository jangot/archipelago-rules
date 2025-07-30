import { IDomainServices } from '@core/modules/domain/idomain.services';
import { PaymentAccountBankVerificationFlow, PaymentAccountBankVerificationFlowCodes, PaymentAccountDetailsTypeCodes, PaymentAccountOwnershipTypeCodes, PaymentAccountProviderCodes, PaymentAccountState, PaymentAccountStateCodes, PersonalPaymentAccountTypeCodes } from '@library/entity/enum';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { EntityNotFoundException } from '@library/shared/common/exception/domain';
import { PaymentAccount } from '@library/shared/domain/entity';
import { FiservAchAccountDetails, FiservDebitAccountDetails } from '@library/shared/type/lending';
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import { DebitCardCreateRequestDto, IavAccountCreateRequestDto, MicrodepositsAccountCreateRequestDto, PaymentMethodCreateRequestDto, PaymentMethodVerifyRequestDto } from './dto/request';
import { BankAccountResponseDto, DebitCardResponseDto, PaymentAccountResponseDto } from './dto/response';

interface DebitAccountCreateData {
  state: PaymentAccountState;
  details: FiservDebitAccountDetails;
}

interface AchAccountCreateData {
  state: PaymentAccountState;
  details: FiservAchAccountDetails;
}

@Injectable()
export class BankingService {
  private readonly logger: Logger = new Logger(BankingService.name);

  constructor(private readonly domainServices: IDomainServices, private readonly config: ConfigService) {}

  public async addPaymentAccount(userId: string, input: PaymentMethodCreateRequestDto): Promise<PaymentAccountResponseDto | null> {
    const { type } = input;
    const result = await this.addPaymentMethod(userId, input);

    if (!result) {
      this.logger.error('Failed to add payment method', { userId, input });
      return null;
    }

    const { id: paymentAccountId } = result;

    // DtoMapper can not handle nested plymorphic types, so we need to handle them manually
    switch (type) {
      case PersonalPaymentAccountTypeCodes.BankAccount:
        if (!this.isDebitCardRequest(input)) { 
          const { verificationFlow } = input;
          if (verificationFlow === PaymentAccountBankVerificationFlowCodes.Microdeposits) {
            // Disburse microdeposits
            await this.disburseMicrodeposits(paymentAccountId);
          } 
        }
        break;
    }

    return this.mapToDto(result);
  }

  public async getPaymentAccountById(userId: string, paymentAccountId: string): Promise<PaymentAccountResponseDto | null> {
    this.logger.debug('Fetching payment account by ID', { paymentAccountId });
    const paymentAccount = await this.getPaymentAccount(paymentAccountId, userId);    
    return this.mapToDto(paymentAccount);
  }

  public async listPaymentAccounts(userId: string): Promise<PaymentAccountResponseDto[]> {
    this.logger.debug('Listing payment accounts for user', { userId });
    const paymentAccounts = await this.domainServices.userServices.getPaymentAccountsByUserId(userId);
    if (!paymentAccounts || paymentAccounts.length === 0) {
      this.logger.warn('No payment accounts found for user', { userId });
      return [];
    }
    this.logger.debug('Payment accounts found', { count: paymentAccounts.length });
    return paymentAccounts.map(account => this.mapToDto(account)).filter(acc => acc !== null);
  }



  // #region TODO: Temporary methods for PaymentAccounts Management support until Fiserv not integrated

  public async verifyPaymentAccount(userId: string, input: PaymentMethodVerifyRequestDto): Promise<PaymentAccountResponseDto | null> {
    this.logger.debug('Start payment account verification', { userId, input });
    const { accountId, verificationFlow } = input;
    const account = await this.getPaymentAccount(accountId, userId);
    const { state } = account;

    switch (state) {
      case PaymentAccountStateCodes.Verified:
        this.logger.warn('Payment account is already verified', { accountId });
        return this.mapToDto(account);
      case PaymentAccountStateCodes.Verifying:
        this.logger.warn('Payment account is already in verification process', { accountId });
        return this.mapToDto(account);
      case PaymentAccountStateCodes.VerificationFailed:
      case PaymentAccountStateCodes.Created:
        const isInitiated = await this.initiateAccountVerification(account, verificationFlow);
        if (!isInitiated) {
          this.logger.error('Failed to initiate account verification', { accountId });
          return null;
        }
        this.logger.debug('Account verification initiated successfully', { accountId });
        // Take refreshed account
        const updatedAccount = await this.getPaymentAccount(accountId, userId);
        return this.mapToDto(updatedAccount);
      case PaymentAccountStateCodes.Suspected:
      case PaymentAccountStateCodes.Inactive:
      default:
        this.logger.error('Payment account is in an unsupported state for verification', { accountId, state });
        throw new EntityNotFoundException('Payment account is in an unsupported state for verification');
    }
  }

  // microdepositsVerification
  public async microdepositsVerification(
    userId: string,
    paymentAccountId: string,
    firstValue: number,
    secondValue: number
  ): Promise<PaymentAccountResponseDto | null> {
    if (!this.canApplyCheats()) {
      throw new NotImplementedException('Microdeposits verification is not implemented');
    }
    this.logger.debug('Verifying microdeposits', { paymentAccountId, firstValue, secondValue });
    await this.getPaymentAccount(paymentAccountId, userId);
    // Simulate verification logic
    // CHEAT: Allow verification with specific values for testing purposes
    if ((firstValue === 0.05 && secondValue === 0.55) || (firstValue === 0.55 && secondValue === 0.05)) {
      await this.domainServices.userServices.updatePaymentAccountVerificationState(paymentAccountId, PaymentAccountStateCodes.Verified);
    } else {
      await this.domainServices.userServices.updatePaymentAccountVerificationState(paymentAccountId, PaymentAccountStateCodes.VerificationFailed);
    }
    const updatedAccount = await this.getPaymentAccount(paymentAccountId, userId);
    return this.mapToDto(updatedAccount);
  }

  // addPaymentMethod // orchestrator
  private async addPaymentMethod(userId: string, input: PaymentMethodCreateRequestDto): Promise<PaymentAccount | null> {
    this.logger.debug('Adding payment method', { userId, input });
    const { type } = input;
    // Make common fields
    const provider = PaymentAccountProviderCodes.Fiserv;
    const ownership = PaymentAccountOwnershipTypeCodes.Personal;

    // Build details based on type
    let data: DebitAccountCreateData | AchAccountCreateData;
    if (this.isDebitCardRequest(input)) {
      data = this.mapToDebitData(input);
    } else {
      data = this.mapToAchData(input);
    }
    const { state, details } = data;

    // store payment account
    const paymentAccount: Partial<PaymentAccount> = {
      userId,
      type,
      provider,
      ownership,
      state,
      details,
    };
    return this.domainServices.userServices.addPaymentAccount(userId, paymentAccount);
  }
  
  // mapToDebit
  private mapToDebitData(input: DebitCardCreateRequestDto): DebitAccountCreateData {
    const { cvv, cardExpiration, cardHolderName, cardNumber } = input;
    const canUseCheats = this.canApplyCheats();
    const fakeToken = `fake-token-${v4()}`;
    const redactedNumber = cardNumber.slice(-4);

    return {
      // CHEAT: Cheat to control state for testing purposes
      state: cvv === '000' && canUseCheats ? PaymentAccountStateCodes.Verified : PaymentAccountStateCodes.VerificationFailed,
      details: {
        type: PaymentAccountDetailsTypeCodes.FiservDebit,
        displayName: redactedNumber,
        redactedAccountNumber: redactedNumber,
        cardToken: fakeToken,
        cardExpiration,
        cardHolderName,
        fullCardNumber: cardNumber,
        cvv,
      },
    };
  };


  // mapToAch
  private mapToAchData(input: MicrodepositsAccountCreateRequestDto | IavAccountCreateRequestDto): AchAccountCreateData { 
    const { routingNumber, accountNumber, verificationFlow } = input;
    const fakeToken = `fake-token-${v4()}`;
    const redactedNumber = accountNumber.slice(-4);

    return {
      state: verificationFlow === PaymentAccountBankVerificationFlowCodes.IAV ? PaymentAccountStateCodes.Verified : PaymentAccountStateCodes.Created,
      details: {
        type: PaymentAccountDetailsTypeCodes.FiservAch,
        displayName: redactedNumber,
        redactedAccountNumber: redactedNumber,
        accountToken: fakeToken,
        routingNumber,
        fullAccountNumber: accountNumber,
        verificationFlow,
      },
    };
  }

  private async initiateAccountVerification(
    paymentAccount: PaymentAccount,
    verificationFlow: PaymentAccountBankVerificationFlow | null
  ): Promise<boolean> {
    this.logger.debug('Initiating account verification', { paymentAccountId: paymentAccount.id });
    const { id, type } = paymentAccount;
    const canUseCheats = this.canApplyCheats();

    if (type === PersonalPaymentAccountTypeCodes.DebitCard && canUseCheats) {
      // CHEAT: Allow immediate verification for debit cards in testing
      await this.domainServices.userServices.updatePaymentAccountVerificationState(id, PaymentAccountStateCodes.Verified);
      return true;
    }

    if (type === PersonalPaymentAccountTypeCodes.BankAccount && verificationFlow) {
      if (verificationFlow === PaymentAccountBankVerificationFlowCodes.IAV) {
        // CHEAT: Allow immediate verification for IAV in testing
        await this.domainServices.userServices.updatePaymentAccountVerificationState(id, PaymentAccountStateCodes.Verified);
        return true;
      } else if (verificationFlow === PaymentAccountBankVerificationFlowCodes.Microdeposits) {
        // For bank accounts, we can disburse microdeposits
        await this.disburseMicrodeposits(id);
        return true;
      }
    }

    return false;
  }

  // disburseMicrodeposits
  private async disburseMicrodeposits(paymentAccountId: string): Promise<void> {
    if (!this.canApplyCheats()) {
      throw new NotImplementedException('Microdeposits disbursement is implemented');
    }
    this.logger.debug('Disbursing microdeposits', { paymentAccountId });
    await this.domainServices.userServices.updatePaymentAccountVerificationState(paymentAccountId, PaymentAccountStateCodes.Verifying);

  }

  private mapToDto(paymentAccount: PaymentAccount): PaymentAccountResponseDto | null {
    const { type, details } = paymentAccount;
    switch (type) {
      case PersonalPaymentAccountTypeCodes.DebitCard:
        const debitDetails = details as FiservDebitAccountDetails;
        const debitResult = {
          ...paymentAccount,
          redactedAccountNumber: details!.redactedAccountNumber,
          cardExpiration: debitDetails.cardExpiration,
        };
        return DtoMapper.toDto(debitResult, DebitCardResponseDto);
      case PersonalPaymentAccountTypeCodes.BankAccount:
        const achDetails = details as FiservAchAccountDetails;
        const achResult = {
          ...paymentAccount,
          redactedAccountNumber: details!.redactedAccountNumber,
          verificationFlow: achDetails.verificationFlow,
        };
        return DtoMapper.toDto(achResult, BankAccountResponseDto);
      default:
        this.logger.error(`Unsupported payment method type: ${type}`);
        throw new NotImplementedException(`Payment method type ${type} is not supported`);
    }
  }

  /**
   * Type guard to check if the input is a DebitCardCreateRequestDto
   * @param input The payment method request to check
   * @returns true if input is a DebitCardCreateRequestDto
   */
  private isDebitCardRequest(input: PaymentMethodCreateRequestDto): input is DebitCardCreateRequestDto {
    return input.type === PersonalPaymentAccountTypeCodes.DebitCard;
  }

  private canApplyCheats(): boolean {
    return this.config.get<string>('NODE_ENV') !== 'production';
  }

  private async getPaymentAccount(accountId: string, ownerId?: string): Promise<PaymentAccount> {
    const paymentAccount = await this.domainServices.userServices.getPaymentAccountById(accountId);
    if (!paymentAccount || (ownerId && paymentAccount.userId !== ownerId)) {
      throw new EntityNotFoundException('Payment account not found');
    }
    return paymentAccount;
  }

  // #endregion
}
