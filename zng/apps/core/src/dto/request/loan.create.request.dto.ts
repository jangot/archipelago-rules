import { LoanPaymentFrequency, LoanPaymentFrequencyCodes, LoanType, LoanTypeCodes } from '@library/entity/enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID } from 'class-validator';
import { NIL } from 'uuid';

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

  @ApiProperty({ description: 'Loan direction. If true, it is a loan offer. If false, it is a loan request.', type: Boolean, required: true, example: true })
  @Expose()
  @IsNotEmpty()
  @IsBoolean()
  isLendLoan: boolean;

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
 

  @ApiProperty({ description: 'Contact URI of target User. Might be either mailto: or tel: ', type: String, required: true, example: 'mailto:john@example.com' })
  @Expose()
  @IsNotEmpty()
  @IsString()
  // TODO: Add custom URI Validator
  targetUserUri: string;
 
  @ApiProperty({ description: 'First name of target User', type: String, required: true, example: 'John' })
  @Expose()
  @IsNotEmpty()
  @IsString()
  targetUserFirstName: string;

  @ApiProperty({ description: 'Last name of target User', type: String, required: true, example: 'Doe' })
  @Expose()
  @IsNotEmpty()
  @IsString()
  targetUserLastName: string;

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
