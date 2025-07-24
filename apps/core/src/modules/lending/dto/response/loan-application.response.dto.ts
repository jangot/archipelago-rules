import { LoanType, LoanTypeCodes } from '@library/entity/enum';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsEmail, IsInt, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

@ApiSchema({ name: 'loanApplicationResponse' })
export class LoanApplicationResponseDto {
  // Loan Application
  @ApiProperty({ description: 'Unique identifier for the loan application', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsOptional()
  @Expose()
  id: string | null;

  @ApiProperty({ description: 'Current state of the loan application', type: 'string', example: 'created' })
  @IsString()
  @IsOptional()
  @Expose()
  status: string | null;

  
  // Biller
  @ApiProperty({ description: 'Unique identifier for the biller', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsOptional()
  @Expose()
  billerId: string | null;

  @ApiProperty({ description: 'Name of the biller', type: 'string', example: 'Electric Company' })
  @IsString()
  @IsOptional()
  @Expose()
  billerName: string | null;

  @ApiProperty({ description: 'Postal code of the biller', type: 'string', example: '90210' })
  @IsString()
  @IsOptional()
  @Expose()
  billerPostalCode: string | null;


  // Bill
  @ApiProperty({ description: 'Account number with the biller', type: 'string', example: '123456789' })
  @IsString()
  @IsOptional()
  @Expose()
  billAccountNumber: string | null;


  // Lender
  @ApiProperty({ description: 'Unique identifier for the lender user account', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  lenderId: string | null;

  @ApiProperty({ description: 'First name of the lender', type: 'string', example: 'Jane' })
  @IsString()
  @IsOptional()
  @Expose()
  lenderFirstName: string | null;

  @ApiProperty({ description: 'Last name of the lender', type: 'string', example: 'Smith' })
  @IsString()
  @IsOptional()
  @Expose()
  lenderLastName: string | null;

  @ApiProperty({ description: 'Email of the lender', type: 'string', example: 'jane.smith@example.com' })
  @IsEmail()
  @IsOptional()
  @Expose()
  lenderEmail: string | null;

  @ApiProperty({ description: 'Relationship of the lender to the borrower', type: 'string', example: 'Friend' })
  @IsString()
  @IsOptional()
  @Expose()
  lenderRelationship: string | null;

  @ApiProperty({ description: 'Optional note from the lender', type: 'string', example: 'Loan for electricity bill' })
  @IsString()
  @IsOptional()
  @Expose()
  lenderNote: string | null;

  @ApiProperty({ description: 'Optional lender payment account ID', type: 'string', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsOptional()
  @Expose()
  lenderPaymentAccountId: string | null;

  @ApiProperty({ description: 'The date when the lender responded to the application', type: 'string', format: 'date-time', example: '2023-01-01T00:00:00Z', required: false })
  @IsDate()
  @IsOptional()
  @Expose()
  lenderRespondedAt: Date | null;


  // Borrower
  @ApiProperty({ description: 'Unique identifier for the borrower user account', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  borrowerId: string | null;

  @ApiProperty({ description: 'First name of the borrower', type: 'string', example: 'John' })
  @IsString()
  @IsOptional()
  @Expose()
  borrowerFirstName: string | null;

  @ApiProperty({ description: 'Last name of the borrower', type: 'string', example: 'Doe' })
  @IsString()
  @IsOptional()
  @Expose()
  borrowerLastName: string | null;

  @ApiProperty({ description: 'Unique identifier for the borrower payment account', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  borrowerPaymentAccountId: string | null;

  @ApiProperty({ description: 'The date when the borrower submitted the application', type: 'string', format: 'date-time', example: '2023-01-01T00:00:00Z', required: false })
  @IsDate()
  @IsOptional()
  @Expose()
  borrowerSubmittedAt: Date | null;


  // Loan
  @ApiProperty({ description: 'Type of the loan', type: 'string', example: LoanTypeCodes.DirectBillPay })
  @IsString()
  @IsOptional()
  @Expose()
  loanType: LoanType | null;

  @ApiProperty({ description: 'Amount of the bill to be paid', type: 'number', example: 150.75 })
  @IsNumber()
  @IsOptional()
  @Expose()
  loanAmount: number | null;

  @ApiProperty({ description: 'Payment frequency for the loan', type: 'string', example: 'monthly' })
  @IsString()
  @IsOptional()
  @Expose()
  loanPaymentFrequency: string | null;

  @ApiProperty({ description: 'Number of loan payments', type: 'integer', example: 12 })
  @IsInt()
  @IsOptional()
  @Expose()
  loanPayments: number | null;

  @ApiProperty({ description: 'Service fee charged for the loan', type: 'number', example: 25.00 })
  @IsNumber()
  @IsOptional()
  @Expose()
  loanServiceFee: number | null;
}
