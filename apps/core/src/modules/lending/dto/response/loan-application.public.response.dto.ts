
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

@ApiSchema({ name: 'publicLoanApplicationResponse' })
export class PublicLoanApplicationResponseDto {
  // Loan Application
  @ApiProperty({ description: 'Unique identifier for the loan application', type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsOptional()
  @Expose()
  id: string | null;

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

  @ApiProperty({ description: 'Optional note from the lender', type: 'string', example: 'Loan for electricity bill' })
  @IsString()
  @IsOptional()
  @Expose()
  lenderNote: string | null;

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

  @ApiProperty({ description: 'The date when the borrower submitted the application', type: 'string', format: 'date-time', example: '2023-01-01T00:00:00Z', required: false })
  @IsDate()
  @IsOptional()
  @Expose()
  borrowerSubmittedAt: Date | null;
}
