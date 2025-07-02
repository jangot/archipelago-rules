import { IDomainServices } from '@core/modules/domain/idomain.services';
import { PaymentAccountResponseDto } from '@core/modules/banking/dto/response/payment-account.response.dto';
import { PaymentMethodCreateRequestDto } from '@core/modules/banking/dto/request/payment-method.create.request.dto';
import { MapToDto } from '@library/entity/mapping/maptodto.decorator';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BankingService {
  private readonly logger: Logger = new Logger(BankingService.name);

  constructor(private readonly domainServices: IDomainServices) {}

  @MapToDto(PaymentAccountResponseDto)
  public async addPaymentAccount(userId: string, input: PaymentMethodCreateRequestDto): Promise<PaymentAccountResponseDto | null> {
    const result = await this.domainServices.userServices.addPaymentAccount(userId, input);
    return result as unknown as PaymentAccountResponseDto | null;
  }
}
