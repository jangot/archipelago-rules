import { BillerResponseDto } from '@core/modules/lending/dto/response';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BillersService {
  private readonly logger: Logger = new Logger(BillersService.name);

  constructor(
  ) { }

  public async getBillers(billerName: string, postalCode: string, limit: number): Promise<BillerResponseDto[]> {
    // Call the domain service to get the billers
    //return this.domainServices.billers.getBillers(billerName, postalCode, limit);

    return [];
  }
}

