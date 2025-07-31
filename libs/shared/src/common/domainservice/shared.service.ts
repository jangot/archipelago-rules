import { IDataService } from '@library/shared/common/data/idata.service';
import { BillersRepository } from '@library/shared/infrastructure/repository/billers.repository';
import { Injectable } from '@nestjs/common';
import { NotificationDefinitionRepository } from '@library/shared/infrastructure/repository';


@Injectable()
export class SharedDataService extends IDataService {
  constructor(
    public readonly billers: BillersRepository,
    public readonly notificationDefinitions: NotificationDefinitionRepository,
  ) {
    super();
  }
}
