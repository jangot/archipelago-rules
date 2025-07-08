import { LoanInviteeType, LoanInviteeTypeCodes, LoanPaymentFrequency, LoanPaymentFrequencyCodes, LoanType, LoanTypeCodes } from '@library/entity/enum';
import { MapTo } from '@library/entity/mapping/mapping.decorators';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';
import { IsAlphaString } from '@library/shared/common/validator/alpha-string.validator';
import { IsValidPhoneNumber } from '@library/shared/common/validator/phone-number.validator';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';
import { NIL } from 'uuid';

@ApiSchema({ name: 'loanInviteeCreateRequest' })
export class LoanInviteeCreateRequestDto {
  @ApiProperty({ description: 'Type of invitee User', type: String, required: true, enum: LoanInviteeTypeCodes, example: LoanInviteeTypeCodes.Borrower })
  @Expose()
  @IsNotEmpty()
  @IsString()
  type: LoanInviteeType;

  @ApiProperty({ description: 'Invitee First Name', type: String, required: false, example: 'John' })
  @Expose()
  @IsString()
  @IsOptional()
  @IsAlphaString()
  @MaxLength(100)
  firstName: string | null;

  @ApiProperty({ description: 'Invitee Last Name', type: String, required: false, example: 'Doe' })
  @Expose()
  @IsString()
  @IsOptional()
  @IsAlphaString()
  @MaxLength(100)
  lastName: string | null;

  @ApiProperty({ description: 'Invitee Email Address', type: String, required: false })
  @Expose()
  @IsEmail()
  @IsOptional()
  @MaxLength(320)
  email: string | null;

  @ApiProperty({ description: 'Invitee Phone Number', type: String, required: false })
  @Expose()
  @IsNotEmpty()
  @MaxLength(32)
  @IsString()
  @IsOptional()
  @IsValidPhoneNumber()
  @MapTo({ transform: transformPhoneNumber })
  phone: string | null;
}
@ApiSchema({ name: 'loanCreateRequest' })
export class LoanCreateRequestDto {
  @ApiProperty({ description: 'Loan amount', type: Number, required: true, example: 100.50 })
  @Expose()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ description: 'Loan type', type: String, required: true, enum: LoanTypeCodes, example: LoanTypeCodes.DirectBillPay })
  @Expose()
  @IsNotEmpty()
  @IsString()
  type: LoanType;

  @ApiProperty({ description: 'Relationship between lender and borrower', type: String, required: false, example: 'Family' })
  @Expose()
  @IsOptional()
  @IsString()
  relationship: string | null;

  @ApiProperty({ description: 'Reason for the loan', type: String, required: false, example: 'Direct Bill Pay' })
  @Expose()
  @IsOptional()
  @IsString()
  reason: string | null;

  @ApiProperty({ description: 'User-defined note for the loan', type: String, required: false, example: 'This is a note' })
  @Expose()
  @IsOptional()
  @IsString()
  note: string | null;

  @ApiProperty({ description: 'URL to the attachment (if any)', type: String, required: false })
  @Expose()
  @IsOptional()
  @IsString()
  attachement: string | null;
 
  @ApiProperty({ description: 'Loan Invitee', type: LoanInviteeCreateRequestDto, required: true })
  @Expose()
  @IsNotEmpty()
  invitee: LoanInviteeCreateRequestDto;

  @ApiProperty({ description: 'Biller ID for Bill Pay Loans', type: String, required: false, example: NIL })
  @Expose()
  @IsOptional()
  @IsUUID()
  billerId: string | null;

  @ApiProperty({ description: 'Billing account number for Bill Pay Loans', type: String, required: false, example: '1234567890' })
  @Expose()
  @IsOptional()
  @IsString()
  billingAccountNumber: string | null;

  @ApiProperty({ description: 'Total number of repayments for the loan', type: Number, required: true, example: 12 })
  @Expose()
  @IsInt()
  @IsPositive()
  paymentsCount: number;

  @ApiProperty({ description: 'Type of repayments frequency', type: String, required: true, enum: LoanPaymentFrequencyCodes, example: LoanPaymentFrequencyCodes.Monthly })
  @Expose()
  @IsNotEmpty()
  @IsString()
  paymentFrequency: LoanPaymentFrequency;
}


