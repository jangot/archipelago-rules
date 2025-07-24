import { IDomainServices } from '@core/modules/domain/idomain.services';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScheduleService {
  private readonly logger: Logger = new Logger(ScheduleService.name);

  constructor(
    private readonly domainServices: IDomainServices,
    private readonly config: ConfigService,) {}
}
