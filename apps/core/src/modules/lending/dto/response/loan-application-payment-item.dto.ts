import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber } from 'class-validator';

@ApiSchema({
  name: 'LoanApplicationPaymentItem',
  description: 'Single payment entry in a loan application payment schedule.',
})
export class LoanApplicationPaymentItemDto {
  @ApiProperty({ type: String, format: 'date-time', description: 'Due date of this payment.' })
  @Type(() => Date)
  @IsDate()
  paymentDate!: Date;

  @ApiProperty({ type: Number, example: 123.45, description: 'Dollar amount due for this installment.' })
  @IsNumber({ maxDecimalPlaces: 2 })
  paymentAmount!: number;

  //TODO: This can/should be removed once the payment schedule is properly implemented and stable.
  @ApiProperty({ type: Number, example: 9876.54, description: 'Remaining balance after this payment is applied.' })
  @IsNumber({ maxDecimalPlaces: 2 })
  loanBalance!: number;
}
