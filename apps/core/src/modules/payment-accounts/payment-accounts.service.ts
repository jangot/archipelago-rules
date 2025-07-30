import { IDomainServices } from '@core/modules/domain/idomain.services';
import { PaymentAccountBankVerificationFlowCodes, PaymentAccountDetailsTypeCodes, PaymentAccountOwnershipTypeCodes, PaymentAccountProviderCodes, PaymentAccountState, PaymentAccountStateCodes, PersonalPaymentAccountTypeCodes } from '@library/entity/enum';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { PaymentAccount } from '@library/shared/domain/entity';
import { FiservAchAccountDetails, FiservDebitAccountDetails } from '@library/shared/type/lending';
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 } from 'uuid';
import { DebitCardCreateRequestDto, IavAccountCreateRequestDto, MicrodepositsAccountCreateRequestDto, PaymentMethodCreateRequestDto } from './dto/request';
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
      case PersonalPaymentAccountTypeCodes.DebitCard:
        const debitDetails = result.details as FiservDebitAccountDetails;
        const debitResult = {
          ...result,
          redactedAccountNumber: result.details!.redactedAccountNumber,
          cardExpiration: debitDetails.cardExpiration,
        };
        return DtoMapper.toDto(debitResult, DebitCardResponseDto);
      case PersonalPaymentAccountTypeCodes.BankAccount:
        if (!this.isDebitCardRequest(input)) { 
          const { verificationFlow } = input;
          if (verificationFlow === PaymentAccountBankVerificationFlowCodes.Microdeposits) {
            // Disburse microdeposits
            await this.disburseMicrodeposits(paymentAccountId);
          } 
        }
        const achDetails = result.details as FiservAchAccountDetails;
        const achResult = {
          ...result,
          redactedAccountNumber: result.details!.redactedAccountNumber,
          verificationFlow: achDetails.verificationFlow,
        };
        return DtoMapper.toDto(achResult, BankAccountResponseDto);
      default:
        this.logger.error(`Unsupported payment method type: ${type}`);
        throw new NotImplementedException(`Payment method type ${type} is not supported`);
    }
  }



  // #region TODO: Temporary methods for PaymentAccounts Management support until Fiserv not integrated

  // microdepositsVerification
  public async microdepositsVerification(paymentAccountId: string, firstValue: number, secondValue: number): Promise<boolean | null> {
    if (!this.canApplyCheats()) {
      throw new NotImplementedException('Microdeposits verification is implemented');
    }
    this.logger.debug('Verifying microdeposits', { paymentAccountId, firstValue, secondValue });
    // Simulate verification logic
    // CHEAT: Allow verification with specific values for testing purposes
    if (firstValue === 0.05 || firstValue === 0.55 && secondValue === 0.05 || secondValue === 0.55) {
      return this.domainServices.userServices.updatePaymentAccountVerificationState(paymentAccountId, PaymentAccountStateCodes.Verified);
    } else {
      return this.domainServices.userServices.updatePaymentAccountVerificationState(paymentAccountId, PaymentAccountStateCodes.VerificationFailed);
    }
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



  // disburseMicrodeposits
  private async disburseMicrodeposits(paymentAccountId: string): Promise<void> {
    if (!this.canApplyCheats()) {
      throw new NotImplementedException('Microdeposits disbursement is implemented');
    }
    this.logger.debug('Disbursing microdeposits', { paymentAccountId });
    await this.domainServices.userServices.updatePaymentAccountVerificationState(paymentAccountId, PaymentAccountStateCodes.Verifying);

  }

  // list
  // getbyid
  // delete

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

  // #endregion
}
