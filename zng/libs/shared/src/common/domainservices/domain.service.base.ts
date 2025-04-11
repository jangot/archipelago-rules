import { Transactional } from 'typeorm-transactional';
import { Injectable } from '@nestjs/common';
import { IDataService } from '../data/idata.service';

@Injectable()
export class BaseDomainServices {
  constructor(protected readonly data: IDataService) {}

  @Transactional()
  public async updateEntities<T extends readonly unknown[] | []>(values: T): Promise<void> {
    await Promise.all(values);
  }
}
