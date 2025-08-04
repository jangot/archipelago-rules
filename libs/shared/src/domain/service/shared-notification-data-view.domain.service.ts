import { Injectable, Logger } from '@nestjs/common';
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { SharedDataService } from '@library/shared/common/domainservice/shared.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SharedNotificationDataViewDomainService extends BaseDomainServices {
  private readonly logger = new Logger(SharedNotificationDataViewDomainService.name);

  constructor(
    protected readonly data: SharedDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  async findForUser(userId: string) {
    this.logger.debug(`Find notification data for user: ${userId}`);

    return this.data.notificatioDataView.findByUserId(userId);
  }
}
