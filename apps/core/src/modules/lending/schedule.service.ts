import { IDomainServices } from '@core/modules/domain/idomain.services';
import { IEventPublisher } from '@library/shared/common/event/interface/ieventpublisher';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScheduleService {
  private readonly logger: Logger = new Logger(ScheduleService.name);
    
  constructor(
    private readonly domainServices: IDomainServices, 
    @Inject(IEventPublisher)
    private readonly eventPublisher: IEventPublisher,
    private readonly config: ConfigService,) {}
}
