import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { SharedNotificationDomainService, BillersDomainService } from '@library/shared/domain/service';

import { DataModule } from '../data';
import { DomainServices } from './domain.services';
import { IDomainServices } from './idomain.services';
import { LoanDomainService, UserDomainService } from './services';
@Module({
  imports: [CqrsModule, ConfigModule, DataModule, JwtModule],
  providers: [
    UserDomainService,
    LoanDomainService,
    BillersDomainService,
    SharedNotificationDomainService,
    { provide: IDomainServices, useClass: DomainServices }],
  exports: [IDomainServices],
})
export class DomainModule {}
