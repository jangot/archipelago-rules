import { BillersDomainService } from '@library/shared/modules/billers/billers.domain.service';
import { BillersModule } from '@library/shared/modules/billers/billers.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { DataModule } from '../data';
import { DomainServices } from './domain.services';
import { IDomainServices } from './idomain.services';
import { LoanDomainService, UserDomainService } from './services';

@Module({
  imports: [CqrsModule, ConfigModule, DataModule, JwtModule, BillersModule],
  providers: [
    UserDomainService, 
    LoanDomainService,
    BillersDomainService,
    { provide: IDomainServices, useClass: DomainServices }],
  exports: [IDomainServices],
})
export class DomainModule {}
