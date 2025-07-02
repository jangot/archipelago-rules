import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsDate, IsDecimal, IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { LoanClosure, LoanFeeMode, LoanPaymentFrequency, LoanState, LoanStateCodes, LoanType, LoanTypeCodes, LoanClosureCodes, LoanPaymentFrequencyCodes, LoanFeeModeCodes, LoanInviteeType, LoanInviteeTypeCodes } from '@library/entity/enum';
import { NIL } from 'uuid';
import { Expose } from 'class-transformer';
import { IsValidPhoneNumber } from '@library/shared/common/validator/phone-number.validator';
import { MapTo } from '@library/entity/mapping/mapping.decorators';
import { transformPhoneNumber } from '@library/shared/common/data/transformers/phone-number.transformer';

@ApiSchema({ name: 'loanInviteeResponse' })
export class LoanInviteeResponseDto {
  @ApiProperty({ description: 'Type of invitee User', type: String, required: true, enum: LoanInviteeTypeCodes, example: LoanInviteeTypeCodes.Borrower })
  @Expose()
  @IsNotEmpty()
  @IsString()
  type: LoanInviteeType;

  @ApiProperty({ description: 'Invitee First Name', type: String, required: false, example: 'John' })
  @Expose()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName: string | null;

  @ApiProperty({ description: 'Invitee Last Name', type: String, required: false, example: 'Doe' })
  @Expose()
  @IsString()
  @IsOptional()
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
@ApiSchema({ name: 'loanResponse' })
export class LoanResponseDto {
  @ApiProperty({ description: 'Unique identifier for the loan', type: 'string', format: 'uuid', example: NIL })
  @IsUUID()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Amount of the loan', type: 'number', example: 1000.50 })
  @IsDecimal()
  amount: number;

  @ApiProperty({ description: 'Unique identifier for the lender', type: 'string', format: 'uuid', example: NIL, required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  lenderId: string | null;

  @ApiProperty({ description: 'Unique identifier for the borrower', type: 'string', format: 'uuid', example: NIL, required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  borrowerId: string | null;

  @ApiProperty({ description: 'Type of the loan', enum: LoanTypeCodes, example: LoanTypeCodes.DirectBillPay })
  type: LoanType;

  @ApiProperty({ description: 'Current state of the loan', enum: LoanStateCodes, example: LoanStateCodes.Created })
  state: LoanState;

  @ApiProperty({ description: 'Closure type of the loan', enum: LoanClosureCodes, example: LoanClosureCodes.PaidOut, required: false })
  @IsOptional()
  @Expose()
  closureType: LoanClosure | null;

  @ApiProperty({ description: 'Relationship between lender and borrower', type: 'string', example: 'Friend', required: false })
  @IsString()
  @IsOptional()
  @Expose()
  relationship: string | null;

  @ApiProperty({ description: 'Reason for the loan', type: 'string', example: 'Medical expenses', required: false })
  @IsString()
  @IsOptional()
  @Expose()
  reason: string | null;

  @ApiProperty({ description: 'User-defined note for the loan', type: 'string', example: 'This is a personal loan.', required: false })
  @IsString()
  @IsOptional()
  @Expose()
  note: string | null;

  @ApiProperty({ description: 'Attachment URL for the loan', type: 'string', example: 'https://example.com/attachment.pdf', required: false })
  @IsString()
  @IsOptional()
  @Expose()
  attachement: string | null;

  @ApiProperty({ description: 'Deeplink for sharing or inviting to the loan', type: 'string', example: 'https://example.com/loan/123', required: false })
  @IsString()
  @IsOptional()
  @Expose()
  deeplink: string | null;

  @ApiProperty({ description: 'Loan Invitee', type: LoanInviteeResponseDto, required: false })
  @Expose()
  @IsOptional()
  invitee: LoanInviteeResponseDto | null;

  @ApiProperty({ description: 'Unique identifier for the biller', type: 'string', format: 'uuid', example: NIL, required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  billerId: string | null;

  @ApiProperty({ description: 'Billing account number for the Bill Pay Loan', type: 'string', example: '123456789', required: false })
  @IsString()
  @IsOptional()
  @Expose()
  billingAccountNumber: string | null;

  @ApiProperty({ description: 'Total number of payments for the loan', type: 'integer', example: 12 })
  @IsInt()
  @Expose()
  paymentsCount: number;

  @ApiProperty({ description: 'Frequency of loan payments', enum: LoanPaymentFrequencyCodes, example: LoanPaymentFrequencyCodes.Monthly })
  paymentFrequency: LoanPaymentFrequency;

  @ApiProperty({ description: 'Fee mode for the loan', enum: LoanFeeModeCodes, example: LoanFeeModeCodes.Standard, required: false })
  @IsOptional()
  @Expose()
  feeMode: LoanFeeMode | null;

  @ApiProperty({ description: 'Total fee value for the loan', type: 'number', example: 50.00, required: false })
  @IsDecimal()
  @IsOptional()
  @Expose()
  feeAmount: number | null;

  @ApiProperty({ description: 'Unique identifier for the lender payment account', type: 'string', format: 'uuid', example: NIL, required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  lenderAccountId: string | null;

  @ApiProperty({ description: 'Unique identifier for the borrower payment account', type: 'string', format: 'uuid', example: NIL, required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  borrowerAccountId: string | null;

  @ApiProperty({ description: 'Date when the loan was created', type: 'string', format: 'date-time', example: '2023-01-01T00:00:00Z' })
  @IsDate()
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Date when the loan was last updated', type: 'string', format: 'date-time', example: '2023-06-01T00:00:00Z', required: false })
  @IsDate()
  @IsOptional()
  @Expose()
  updatedAt: Date | null;

  @ApiProperty({ description: 'Date when the loan was accepted', type: 'string', format: 'date-time', example: '2023-02-01T00:00:00Z', required: false })
  @IsDate()
  @IsOptional()
  @Expose()
  acceptedAt: Date | null;
}
