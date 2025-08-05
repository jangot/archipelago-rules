import { IDataService } from '@library/shared/common/data/idata.service';
import {
  BillersRepository,
  NotificationDataViewRepository,
  NotificationDefinitionRepository,
} from '@library/shared/infrastructure/repository';
import { Injectable } from '@nestjs/common';




@Injectable()
export class SharedDataService extends IDataService {
  constructor(
    public readonly billers: BillersRepository,
    public readonly notificationDefinitions: NotificationDefinitionRepository,
    public readonly notificationDataView: NotificationDataViewRepository,
  ) {
    super();
  }
}
