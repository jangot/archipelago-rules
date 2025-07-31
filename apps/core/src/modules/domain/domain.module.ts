import { BillersDomainService } from '@library/shared/domain/service/billers.domain.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { DataModule } from '../data';
import { DomainServices } from './domain.services';
import { IDomainServices } from './idomain.services';
import { LoanDomainService, NotificationDomainService, UserDomainService } from './services';
@Module({
  imports: [CqrsModule, ConfigModule, DataModule, JwtModule],
  providers: [
    UserDomainService,
    LoanDomainService,
    BillersDomainService,
    NotificationDomainService,
    { provide: IDomainServices, useClass: DomainServices }],
  exports: [IDomainServices],
})
export class DomainModule {}
