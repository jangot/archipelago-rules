import { PartialType } from '@nestjs/mapped-types';
import { LoanApplicationRequestDto } from '@core/modules/lending/dto/request/loan-application.request.dto';

export class LoanApplicationUpdateDto extends PartialType(LoanApplicationRequestDto) {}
