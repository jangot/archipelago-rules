
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { SharedDataService } from '@library/shared/common/domainservice/shared.service';
import { Biller } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BillersDomainService extends BaseDomainServices {
  private readonly logger: Logger = new Logger(BillersDomainService.name);

  constructor(
    protected readonly dataService: SharedDataService,
  ) {
    super(dataService);
  }

  public async getBillers(billerName: string, postalCode: string, limit: number): Promise<Biller[]> {
    this.logger.debug(`getBillers: Fetching billers with name: ${billerName} and postalCode: ${postalCode} for a maximum of ${limit} results`);

    return [ ];
  }
}
