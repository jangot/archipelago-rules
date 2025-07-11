import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';
import { LoanType, LoanTypeCodes } from '@library/entity/enum';

@ApiSchema({ name: 'loanApplicationResponse' })
export class LoanApplicationResponseDto {
  // Loan Application fields
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

  // Biller fields
  @ApiProperty({ description: 'Name of the biller', type: 'string', example: 'Electric Company' })
  @IsString()
  @IsOptional()
  @Expose()
  billerName: string | null;

  @ApiProperty({ description: 'Unique identifier for the biller', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsOptional()
  @Expose()
  billerId: string | null;

  @ApiProperty({ description: 'Postal code of the biller', type: 'string', example: '90210' })
  @IsString()
  @IsOptional()
  @Expose()
  billerPostalCode: string | null;

  @ApiProperty({ description: 'Account number with the biller', type: 'string', example: '123456789' })
  @IsString()
  @IsOptional()
  @Expose()
  billAccount: string | null;

  @ApiProperty({ description: 'Amount of the bill to be paid', type: 'number', example: 150.75 })
  @IsNumber()
  @IsOptional()
  @Expose()
  billAmount: number | null;

  // Lender fields
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

  @ApiProperty({ description: 'Unique identifier for the lender payment account', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  lenderAccountId: string | null;

  // Borrower fields
  @ApiProperty({ description: 'Unique identifier for the borrower payment account', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  borrowerAccountId: string | null;

  // Loan fields
  @ApiProperty({ description: 'Type of the loan', type: 'string', example: LoanTypeCodes.DirectBillPay })
  @IsString()
  @IsOptional()
  @Expose()
  loanType: LoanType | null;

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
