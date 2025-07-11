import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { LoanType } from '@library/entity/enum';

@ApiSchema({ name: 'loanApplicationRequest' })
export class LoanApplicationRequestDto {
  // Loan Application fields
  @ApiProperty({ description: 'Current state of the loan application', type: 'string', example: 'Created', required: false })
  @IsString()
  @IsOptional()
  status: string | null;

  // Biller fields
  @ApiProperty({ description: 'Name of the biller', type: 'string', example: 'Electric Company', required: false })
  @IsString()
  @IsOptional()
  billerName: string | null;

  @ApiProperty({ description: 'Unique identifier for the biller', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
  @IsUUID()
  @IsOptional()
  billerId: string | null;

  @ApiProperty({ description: 'Postal code of the biller', type: 'string', example: '90210', required: false })
  @IsString()
  @IsOptional()
  billerPostalCode: string | null;

  @ApiProperty({ description: 'Account number with the biller', type: 'string', example: '123456789', required: false })
  @IsString()
  @IsOptional()
  billAccount: string | null;

  @ApiProperty({ description: 'Amount of the bill to be paid', type: 'number', example: 150.75, required: false })
  @IsNumber()
  @IsOptional()
  billAmount: number | null;

  // Lender fields
  @ApiProperty({ description: 'First name of the lender', type: 'string', example: 'Jane', required: false })
  @IsString()
  @IsOptional()
  lenderFirstName: string | null;

  @ApiProperty({ description: 'Last name of the lender', type: 'string', example: 'Smith', required: false })
  @IsString()
  @IsOptional()
  lenderLastName: string | null;

  @ApiProperty({ description: 'Email of the lender', type: 'string', example: 'jane.smith@example.com', required: false })
  @IsEmail()
  @IsOptional()
  lenderEmail: string | null;

  @ApiProperty({ description: 'Relationship of the lender to the borrower', type: 'string', example: 'Friend', required: false })
  @IsString()
  @IsOptional()
  lenderRelationship: string | null;

  @ApiProperty({ description: 'Optional note from the lender', type: 'string', example: 'Loan for electricity bill', required: false })
  @IsString()
  @IsOptional()
  lenderNote: string | null;

  @ApiProperty({ description: 'Unique identifier for the lender payment account', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
  @IsUUID()
  @IsOptional()
  lenderAccountId: string | null;

  // Borrower fields
  @ApiProperty({ description: 'Unique identifier for the borrower payment account', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440001', required: false })
  @IsUUID()
  @IsOptional()
  borrowerAccountId: string | null;

  // Loan fields
  @ApiProperty({ description: 'Type of the loan', type: 'string', example: 'DirectBillPay', required: false })
  @IsString()
  @IsOptional()
  loanType: LoanType | null;

  @ApiProperty({ description: 'Number of loan payments', type: 'integer', example: 12, required: false })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  loanPayments: number | null;
}
