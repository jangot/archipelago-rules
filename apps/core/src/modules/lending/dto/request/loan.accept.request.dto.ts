import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { NIL } from 'uuid';

@ApiSchema({ name: 'loanAcceptRequest' })
export class LoanAcceptRequestDto {
  @ApiProperty({ description: 'Unique identifier for the acceptor Payment Account', type: String, required: true, example: NIL })
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  paymentAccountId: string;
}
