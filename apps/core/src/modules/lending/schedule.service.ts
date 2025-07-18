import { IDomainServices } from '@core/modules/domain/idomain.services';
import { EventManager } from '@library/shared/common/event/event-manager';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScheduleService {
  private readonly logger: Logger = new Logger(ScheduleService.name);
    
  constructor(
    private readonly domainServices: IDomainServices, 
    private readonly eventManager: EventManager,
    private readonly config: ConfigService,) {}
}
