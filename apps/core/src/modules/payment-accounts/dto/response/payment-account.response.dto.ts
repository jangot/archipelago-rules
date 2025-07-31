import { PaymentAccountBankVerificationFlow, PaymentAccountBankVerificationFlowCodes, PaymentAccountProvider, PaymentAccountProviderCodes, PaymentAccountState, PaymentAccountStateCodes, PaymentAccountTypeCodes, PersonalPaymentAccountType } from '@library/entity/enum';
import { BankVerificationBase, PersonalPaymentMethodBase } from '@library/shared/type/lending';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { NIL } from 'uuid';

class PaymentAccountResponseBase {
  @ApiProperty({ description: 'Unique identifier for the payment account', example: NIL })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Unique identifier for the owner of the payment account', example: NIL })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  userId: string;

  @ApiProperty({ description: 'Redacted account number for security purposes', example: '1234' })
  @IsNotEmpty()
  @Expose()
  redactedAccountNumber: string;

  @ApiProperty({ description: 'Current state of the payment account', enum: PaymentAccountStateCodes, example: PaymentAccountStateCodes.Verified })
  @IsNotEmpty()
  @Expose()
  state: PaymentAccountState;
}

export class DebitCardResponseDto extends PaymentAccountResponseBase implements PersonalPaymentMethodBase {
  @ApiProperty({ description: 'Type of the payment account', enum: PaymentAccountTypeCodes, example: PaymentAccountTypeCodes.DebitCard })
  @IsNotEmpty()
  @Expose()
  type: PersonalPaymentAccountType = PaymentAccountTypeCodes.DebitCard;

  @ApiProperty({ description: 'Provider of the payment account', enum: PaymentAccountProviderCodes, example: PaymentAccountProviderCodes.Fiserv })
  @IsNotEmpty()
  @Expose()
  provider: PaymentAccountProvider = PaymentAccountProviderCodes.Fiserv;

  @ApiProperty({ description: 'Card expiration date in MMYY format', example: '1225' })
  @IsNotEmpty()
  @Expose()
  cardExpiration: string;
}

export class BankAccountResponseDto extends PaymentAccountResponseBase implements PersonalPaymentMethodBase, BankVerificationBase {
  
  @ApiProperty({ description: 'Type of the payment account', enum: PaymentAccountTypeCodes, example: PaymentAccountTypeCodes.BankAccount })
  @IsNotEmpty()
  @Expose()
  type: PersonalPaymentAccountType = PaymentAccountTypeCodes.BankAccount;

  @ApiProperty({ description: 'Provider of the payment account', enum: PaymentAccountProviderCodes, example: PaymentAccountProviderCodes.Fiserv })
  @IsNotEmpty()
  @Expose()
  provider: PaymentAccountProvider = PaymentAccountProviderCodes.Fiserv;

  @ApiProperty({ description: 'Bank verification flow method', enum: PaymentAccountBankVerificationFlowCodes, example: PaymentAccountBankVerificationFlowCodes.Microdeposits })
  @IsNotEmpty()
  @Expose()
  verificationFlow: PaymentAccountBankVerificationFlow;
}

export type PaymentAccountResponseDto = DebitCardResponseDto | BankAccountResponseDto;
