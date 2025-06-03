import { IDomainServices } from '@core/domain/idomain.services';
import { PaymentAccountResponseDto, PaymentMethodCreateRequestDto } from '@core/dto';
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
