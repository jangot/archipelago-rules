import { PaymentAccountProvider, PaymentAccountProviderCodes, PaymentAccountType, PaymentAccountTypeCodes } from '@library/entity/enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class PaymentMethodCreateRequestDto {
  @ApiProperty({ description: 'Type of payment method', type: String, required: true, example: PaymentAccountTypeCodes.BankAccount })
  @IsString()
  @IsNotEmpty()
  @Expose()
  type: PaymentAccountType;

  @ApiProperty({ description: 'Provider of payment method', type: String, required: true, example: PaymentAccountProviderCodes.Checkbook })
  @IsString()
  @IsNotEmpty()
  @Expose()
  provider: PaymentAccountProvider;
    
}
