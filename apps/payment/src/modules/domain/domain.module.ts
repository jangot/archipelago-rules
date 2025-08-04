import { BillersDomainService } from '@library/shared/domain/service/billers.domain.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DataModule } from '../data';
import { DomainServices } from './domain.services';
import { IDomainServices } from './idomain.services';
import { PaymentDomainService } from './services';


@Module({
  imports: [
    CqrsModule, 
    ConfigModule, 
    DataModule, 
  ],
  providers: [
    PaymentDomainService,
    BillersDomainService,
    { provide: IDomainServices, useClass: DomainServices },
  ],
  exports: [IDomainServices, PaymentDomainService],
})
export class DomainModule {}
