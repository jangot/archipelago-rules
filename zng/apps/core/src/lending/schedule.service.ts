import { IDomainServices } from '@core/domain/idomain.services';
import { Logger } from '@nestjs/common';

export class ScheduleService {
  private readonly logger: Logger = new Logger(ScheduleService.name);
  
  constructor(private readonly domainServices: IDomainServices) {}

}
