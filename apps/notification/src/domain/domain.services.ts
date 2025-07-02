/*
 * File Name   : domain.services.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Apr 14 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */
import { Injectable } from '@nestjs/common';
import { NotificationDomainService } from './services/notification.definition.service';
import { IDomainServices } from './domain.iservices';

@Injectable()
export class DomainServices implements IDomainServices {
  constructor(
    public readonly notificationServices: NotificationDomainService
  ) {}
}
