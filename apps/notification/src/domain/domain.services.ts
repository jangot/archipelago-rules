/*
 * File Name   : domain.services.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Apr 14 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */
import { Injectable } from '@nestjs/common';
import { IDomainServices } from './domain.iservices';
import { NotificationDefinitionItemDomainService } from './services/notification.definition.item.service';
import { NotificationDomainService } from './services/notification.definition.service';

@Injectable()
export class DomainServices implements IDomainServices {
  constructor(
    public readonly notificationServices: NotificationDomainService,
    public readonly notificationDefinitionItemServices: NotificationDefinitionItemDomainService
  ) {}
}
