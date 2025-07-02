import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { NIL } from 'uuid';

@ApiSchema({ name: 'loanProposeRequest' })
export class LoanProposeRequestDto {
  @ApiProperty({ description: 'Source payment account ID. For `Loan Offer` it is Lender Payment Account Id, for `Loan Request` - Borrower Payment Account Id', type: String, required: true, example: NIL })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  sourcePaymentAccountId: string;
}
