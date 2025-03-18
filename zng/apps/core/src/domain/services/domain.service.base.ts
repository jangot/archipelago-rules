import { Transactional } from 'typeorm-transactional';
import { IDataService } from '../../data/idata.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseDomainServices {
  constructor(protected readonly data: IDataService) {}

  @Transactional()
  public async updateEntities<T extends readonly unknown[] | []>(values: T): Promise<void> {
    await Promise.all(values);
  }
}
