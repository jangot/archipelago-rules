import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseDomainServices } from '@library/shared/common/domainservice';
import { SharedDataService } from '@library/shared/common/domainservice/shared.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SharedNotificationDataViewDomainService extends BaseDomainServices implements OnModuleInit {
  private readonly logger = new Logger(SharedNotificationDataViewDomainService.name);

  constructor(
    protected readonly data: SharedDataService,
    protected readonly config: ConfigService
  ) {
    super(data);
  }

  async onModuleInit(): Promise<void> {
    await this.data.notificatioDataView.initView();
  }
}
