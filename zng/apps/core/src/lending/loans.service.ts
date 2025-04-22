import { IDomainServices } from '@core/domain/idomain.services';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoansService {
  private readonly logger: Logger = new Logger(LoansService.name);
    
  constructor(private readonly domainServices: IDomainServices) {}
    
}
