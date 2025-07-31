import { PaymentAccountBankVerificationFlow, PaymentAccountBankVerificationFlowCodes, PaymentAccountTypeCodes, PersonalPaymentAccountType, PersonalPaymentAccountTypeCodes } from '@library/entity/enum';
import { BankVerificationBase, PersonalPaymentMethodBase } from '@library/shared/type/lending';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, Length, Matches } from 'class-validator';



export class DebitCardCreateRequestDto implements PersonalPaymentMethodBase {
  @ApiProperty({ description: 'Type of payment method', type: String, required: true, example: PaymentAccountTypeCodes.DebitCard, enum: PersonalPaymentAccountTypeCodes })
  @IsEnum(PaymentAccountTypeCodes, { message: 'Type must be a valid payment account type' })
  @IsNotEmpty({ message: 'Type is required' })
  @Expose()
  readonly type: PersonalPaymentAccountType = PaymentAccountTypeCodes.DebitCard;
  
  @ApiProperty({ description: 'Card holder full name', type: String, required: true, example: 'John Doe' })
  @IsString({ message: 'Card holder name must be a string' })
  @IsNotEmpty({ message: 'Card holder name is required' })
  @Length(1, 100, { message: 'Card holder name must be between 1 and 100 characters' })
  @Expose()
  cardHolderName: string;
  
  @ApiProperty({ description: 'Card number (without spaces or dashes)', type: String, required: true, example: '4111111111111111' })
  @IsString({ message: 'Card number must be a string' })
  @IsNotEmpty({ message: 'Card number is required' })
  @Matches(/^\d{13,19}$/, { message: 'Card number must be 13-19 digits' })
  @Expose()
  cardNumber: string;
  
  @ApiProperty({ description: 'Card verification value (CVV)', type: String, required: true, example: '123' })
  @IsString({ message: 'CVV must be a string' })
  @IsNotEmpty({ message: 'CVV is required' })
  @Matches(/^\d{3,4}$/, { message: 'CVV must be 3 or 4 digits' })
  @Expose()
  cvv: string;
  
  @ApiProperty({ description: 'Card expiration date in MMYY format', type: String, required: true, example: '1225' })
  @IsString({ message: 'Card expiration must be a string' })
  @IsNotEmpty({ message: 'Card expiration is required' })
  @Matches(/^(0[1-9]|1[0-2])\d{2}$/, { message: 'Card expiration must be in MMYY format' })
  @Expose()
  cardExpiration: string; // Format: MMYY
}

export class MicrodepositsAccountCreateRequestDto implements PersonalPaymentMethodBase, BankVerificationBase {
  @ApiProperty({ description: 'Type of payment method', type: String, required: true, example: PaymentAccountTypeCodes.BankAccount, enum: PersonalPaymentAccountTypeCodes })
  @IsEnum(PaymentAccountTypeCodes, { message: 'Type must be a valid payment account type' })
  @IsNotEmpty({ message: 'Type is required' })
  @Expose()
  readonly type: PersonalPaymentAccountType = PaymentAccountTypeCodes.BankAccount;

  @ApiProperty({ description: 'Bank verification flow type', type: String, required: true, enum: PaymentAccountBankVerificationFlowCodes, example: PaymentAccountBankVerificationFlowCodes.Microdeposits })
  @IsEnum(PaymentAccountBankVerificationFlowCodes, { message: 'Verification flow must be a valid type' })
  @IsNotEmpty({ message: 'Verification flow is required' })
  @Expose()
  readonly verificationFlow: PaymentAccountBankVerificationFlow = PaymentAccountBankVerificationFlowCodes.Microdeposits;
  
  @ApiProperty({ description: 'Bank routing number (9 digits)', type: String, required: true, example: '123456789' })
  @IsString({ message: 'Routing number must be a string' })
  @IsNotEmpty({ message: 'Routing number is required' })
  @Matches(/^\d{9}$/, { message: 'Routing number must be exactly 9 digits' })
  @Expose()
  routingNumber: string;
  
  @ApiProperty({ description: 'Bank account number', type: String, required: true, example: '1234567890' })
  @IsString({ message: 'Account number must be a string' })
  @IsNotEmpty({ message: 'Account number is required' })
  @Length(4, 20, { message: 'Account number must be between 4 and 20 characters' })
  @Matches(/^\d+$/, { message: 'Account number must contain only digits' })
  @Expose()
  accountNumber: string;
}

export class IavAccountCreateRequestDto implements PersonalPaymentMethodBase, BankVerificationBase {
  @ApiProperty({ description: 'Type of payment method', type: String, required: true, example: PaymentAccountTypeCodes.BankAccount, enum: PersonalPaymentAccountTypeCodes })
  @IsEnum(PaymentAccountTypeCodes, { message: 'Type must be a valid payment account type' })
  @IsNotEmpty({ message: 'Type is required' })
  @Expose()
  readonly type: PersonalPaymentAccountType = PaymentAccountTypeCodes.BankAccount;

  @ApiProperty({ description: 'Bank verification flow type', type: String, required: true, enum: PaymentAccountBankVerificationFlowCodes, example: PaymentAccountBankVerificationFlowCodes.IAV })
  @IsEnum(PaymentAccountBankVerificationFlowCodes, { message: 'Verification flow must be a valid type' })
  @IsNotEmpty({ message: 'Verification flow is required' })
  @Expose()
  readonly verificationFlow: PaymentAccountBankVerificationFlow = PaymentAccountBankVerificationFlowCodes.IAV;
  
  @ApiProperty({ description: 'Bank routing number (9 digits)', type: String, required: true, example: '123456789' })
  @IsString({ message: 'Routing number must be a string' })
  @IsNotEmpty({ message: 'Routing number is required' })
  @Matches(/^\d{9}$/, { message: 'Routing number must be exactly 9 digits' })
  @Expose()
  routingNumber: string;
  
  @ApiProperty({ description: 'Bank account number', type: String, required: true, example: '1234567890' })
  @IsString({ message: 'Account number must be a string' })
  @IsNotEmpty({ message: 'Account number is required' })
  @Length(4, 20, { message: 'Account number must be between 4 and 20 characters' })
  @Matches(/^\d+$/, { message: 'Account number must contain only digits' })
  @Expose()
  accountNumber: string;
}

export type PaymentMethodCreateRequestDto = DebitCardCreateRequestDto | MicrodepositsAccountCreateRequestDto | IavAccountCreateRequestDto;
