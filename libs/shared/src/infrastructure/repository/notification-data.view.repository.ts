import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationDataView } from '@library/shared/domain/entity/notification-data.vew';

@Injectable()
export class NotificationDataViewRepository {
  constructor(
    @InjectRepository(NotificationDataView)
    repository: Repository<NotificationDataView>,
  ) {}
}
