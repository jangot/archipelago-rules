/*
 * File Name   : domain.services.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Apr 14 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */
import { Injectable } from '@nestjs/common';
import { IDomainServices } from '@notification/domain/domain.iservices';
import { NotificationDefinitionItemDomainService } from '@notification/domain/services/notification.definition.item.service';
import { NotificationDomainService } from '@notification/domain/services/notification.definition.service';
import { NotificationLogDomainService } from '@notification/domain/services/notification.log.service';
import { SharedNotificationDataViewDomainService } from '@library/shared/domain/service';

@Injectable()
export class DomainServices implements IDomainServices {
  constructor(
    public readonly notificationServices: NotificationDomainService,
    public readonly notificationDefinitionItemServices: NotificationDefinitionItemDomainService,
    public readonly notificationLogServices: NotificationLogDomainService,
    public readonly notificationDataViewDomainService: SharedNotificationDataViewDomainService
  ) {}
}
