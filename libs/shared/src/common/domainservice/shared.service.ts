import { IDataService } from '@library/shared/common/data/idata.service';
import { BillersRepository } from '@library/shared/modules/billers/billers.repository';
import { Injectable } from '@nestjs/common';


@Injectable()
export class SharedDataService extends IDataService {
  constructor(
    public readonly billers: BillersRepository,
  ) {
    super();
  } 
}
