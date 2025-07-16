import { LoanPaymentFrequency, LoanPaymentFrequencyCodes, LoanType, LoanTypeCodes } from '@library/entity/enum';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, Min } from 'class-validator';
import { NIL } from 'uuid';

@ApiSchema({ name: 'loanCreateRequest' })
export class LoanCreateRequestDto {
  @ApiProperty({ description: 'Loan amount', type: Number, required: true, example: 100.50, minimum: 20, maximum: 1000 })
  @Expose()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty()
  @Min(20)
  @Max(1000)
  amount: number;

  @ApiProperty({ description: 'Loan type', type: String, required: true, enum: LoanTypeCodes, example: LoanTypeCodes.DirectBillPay })
  @Expose()
  @IsNotEmpty()
  @IsString()
  type: LoanType;

  @ApiProperty({ description: 'Relationship between lender and borrower', type: String, required: false, example: 'Family' })
  @Expose()
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


