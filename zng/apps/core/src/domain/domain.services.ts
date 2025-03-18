import { Injectable } from '@nestjs/common';
import { IDomainServices } from './idomain.services';
import { UserDomainService } from './services/user.domain.service';

/*
 * File Name   : domain.service.ts
 * Author      : Michael LeDuc
 * Created Date: Sun Mar 16 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

@Injectable()
export class DomainServices implements IDomainServices {
  constructor(public readonly userServices: UserDomainService) {}
}
