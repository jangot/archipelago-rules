import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { NIL } from 'uuid';

export class PaymentMethodProceedVerificationRequestDto {

  @ApiProperty({ description: 'Unique identifier for the payment account', example: NIL, required: true })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  accountId: string;

  @ApiProperty({ description: 'Account verification data', type: () => MicrodepositsValuesRequestDto, required: true })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MicrodepositsValuesRequestDto)
  @Expose()
  data: AccountVerificationData;
}

export class MicrodepositsValuesRequestDto {
  
  @ApiProperty({ description: 'First microdeposit value', type: Number, required: true, example: 0.05 })
  @IsNotEmpty({ message: 'First microdeposit value is required' })
  @Expose()
  firstValue: number;

  @ApiProperty({ description: 'Second microdeposit value', type: Number, required: true, example: 0.55 })
  @IsNotEmpty({ message: 'Second microdeposit value is required' })
  @Expose()
  secondValue: number;
}

export type AccountVerificationData = MicrodepositsValuesRequestDto;
