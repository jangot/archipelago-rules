import { IDomainServices } from '@core/modules/domain/idomain.services';
import { PaymentMethodCreateRequestDto } from '@core/modules/payment-accounts/dto/request/payment-method.create.request.dto';
import { PaymentAccountResponseDto } from '@core/modules/payment-accounts/dto/response/payment-account.response.dto';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BankingService {
  private readonly logger: Logger = new Logger(BankingService.name);

  constructor(private readonly domainServices: IDomainServices) {}

  public async addPaymentAccount(userId: string, input: PaymentMethodCreateRequestDto): Promise<PaymentAccountResponseDto | null> {
    const result = await this.domainServices.userServices.addPaymentAccount(userId, input);

    return DtoMapper.toDto(result, PaymentAccountResponseDto);
  }
}
