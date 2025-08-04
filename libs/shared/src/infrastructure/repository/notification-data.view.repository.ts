import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDataView } from '@library/shared/domain/entity/notification-data.vew';

@Injectable()
export class NotificationDataViewRepository {
  constructor(
    @InjectRepository(NotificationDataView)
    private readonly repository: Repository<NotificationDataView>,
  ) {}

  async findByUserId(userId: string): Promise<NotificationDataView | null> {
    return this.repository.findOne({ where: { userId } });
  }
}
