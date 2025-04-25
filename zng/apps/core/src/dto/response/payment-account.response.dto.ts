import { PaymentAccountProvider, PaymentAccountProviderCodes, PaymentAccountType, PaymentAccountTypeCodes } from '@library/entity/enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { NIL } from 'uuid';

export class PaymentAccountResponseDto {
  @ApiProperty({ description: 'Unique identifier for the payment account', example: NIL })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Unique identifier for the owner of the payment account', example: NIL })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  ownerId: string;

  @ApiProperty({ description: 'Type of the payment account', enum: PaymentAccountTypeCodes, example: PaymentAccountTypeCodes.BankAccount })
  @IsNotEmpty()
  @Expose()
  type: PaymentAccountType;

  @ApiProperty({ description: 'Provider of the payment account', enum: PaymentAccountProviderCodes, example: PaymentAccountProviderCodes.Checkbook })
  @IsNotEmpty()
  @Expose()
  provider: PaymentAccountProvider;
}
