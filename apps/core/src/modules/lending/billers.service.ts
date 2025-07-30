import { IDomainServices } from '@core/modules/domain/idomain.services';
import { BillerResponseDto } from '@core/modules/lending/dto/response';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BillersService {
  private readonly logger: Logger = new Logger(BillersService.name);

  constructor(
    private readonly domainServices: IDomainServices,
  ) { }

  public async getBillers(billerName: string, postalCode: string, limit: number): Promise<BillerResponseDto[]> {
    this.logger.debug(`getBillers: Fetching billers with name: ${billerName} and postalCode: ${postalCode} for a maximum of ${limit} results`);
    
    const billers = await this.domainServices.billersServices.getBillers(billerName, postalCode, limit);
    
    return billers.map(biller => ({
      billerId: biller.id,
      billerName: biller.name,
      billerPostalCode: biller.territoryCode || '',
      billerClass: biller.billerClass || '',
    }));
  }
}

