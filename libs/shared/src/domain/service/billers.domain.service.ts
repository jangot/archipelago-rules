
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { SharedDataService } from '@library/shared/common/domainservice/shared.service';
import { Biller } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { ILike, Like } from 'typeorm';

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

    const term = (billerName ?? '').trim().toLowerCase();
    const zip  = (postalCode ?? '').trim();

    const page = await this.dataService.billers.find({
      where: {
        territoryCode: Like(`${zip}%`),
        name: ILike(`%${term}%`),
      },
      order: { name: 'ASC' },
      take: limit > 0 ? limit : undefined,
    });

    const billers: Biller[] = (page as unknown as { data: Biller[] }).data;

    return billers;
  }
}
