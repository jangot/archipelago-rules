import { PaymentAccountBankVerificationFlow, PaymentAccountBankVerificationFlowCodes } from '@library/entity/enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { NIL } from 'uuid';

export class PaymentMethodVerifyRequestDto { 
  @ApiProperty({ description: 'Unique identifier for the payment account', example: NIL, required: true })
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  accountId: string;

  @ApiProperty({ description: 'Verification flow method', enum: PaymentAccountBankVerificationFlowCodes, example: PaymentAccountBankVerificationFlowCodes.Microdeposits, required: false })
  @IsOptional()
  @Expose()
  verificationFlow: PaymentAccountBankVerificationFlow | null;
}
