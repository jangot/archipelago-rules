import { BillersDomainService } from '@library/shared/domain/service/billers.domain.service';
import { Injectable } from '@nestjs/common';
import { IDomainServices } from './idomain.services';
import { LoanDomainService, NotificationDomainService, UserDomainService } from '@core/modules/domain/services';

/*
 * File Name   : domain.service.ts
 * Author      : Michael LeDuc
 * Created Date: Sun Mar 16 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

@Injectable()
export class DomainServices implements IDomainServices {
  constructor(
    public readonly userServices: UserDomainService,
    public readonly loanServices: LoanDomainService,
    public readonly billersServices: BillersDomainService,
    public readonly notificationServices: NotificationDomainService,
  ) {}
}
