/*
 * File Name   : idata.service.ts
 * Author      : Michael LeDuc
 * Created Date: Thu Apr 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { BillersRepository, NotificationDefinitionRepository } from '@library/shared/infrastructure/repository';
import {
  NotificationDataViewRepository
} from '@library/shared/infrastructure/repository/notification-data.view.repository';

/**
 * Abstract base class for data services providing TypeORM repository access
 */
export abstract class IDataService {
  public readonly billers: BillersRepository;
  public readonly notificationDefinitions: NotificationDefinitionRepository;
  public readonly notificationDataView: NotificationDataViewRepository;
}
