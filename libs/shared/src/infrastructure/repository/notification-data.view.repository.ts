import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDataView } from '@library/shared/domain/entity/notification-data.vew';
import { NotificationDataItems } from '@library/entity/enum/notification-data-items';
import { FindOptionsSelect } from 'typeorm/find-options/FindOptionsSelect';

@Injectable()
export class NotificationDataViewRepository {
  constructor(
    @InjectRepository(NotificationDataView)
    private readonly repository: Repository<NotificationDataView>,
  ) {}

  async findByUserId(userId: string, includeData: NotificationDataItems[]): Promise<NotificationDataView | null> {
    const select: FindOptionsSelect<NotificationDataView> = {};

    includeData.forEach((item) => {
      select[item] = true;
    });

    return this.repository.findOne({
      where: { userId },
      select,
    });
  }
}
