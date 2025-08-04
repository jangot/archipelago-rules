import { IDataService } from '@library/shared/common/data/idata.service';
import { Injectable } from '@nestjs/common';
import {
  NotificationDefinitionRepository,
  BillersRepository,
  NotificationDataViewRepository,
} from '@library/shared/infrastructure/repository';




@Injectable()
export class SharedDataService extends IDataService {
  constructor(
    public readonly billers: BillersRepository,
    public readonly notificationDefinitions: NotificationDefinitionRepository,
    public readonly notificatioDataView: NotificationDataViewRepository,
  ) {
    super();
  }
}
