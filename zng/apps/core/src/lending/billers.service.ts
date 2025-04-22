import { IDomainServices } from '@core/domain/idomain.services';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BillersService {
  private readonly logger: Logger = new Logger(BillersService.name);

  constructor(private readonly domainServices: IDomainServices) {}
}
