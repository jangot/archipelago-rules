import { BillersDomainService } from '@library/shared/domain/service/billers.domain.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DataModule } from '../data';
import { DomainServices } from './domain.services';
import { IDomainServices } from './idomain.services';
import { PaymentDomainService } from './services';
import {
  SharedNotificationDataViewDomainService,
  SharedNotificationDomainService,
} from '@library/shared/domain/service';


@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    DataModule,
  ],
  providers: [
    PaymentDomainService,
    BillersDomainService,
    SharedNotificationDomainService,
    SharedNotificationDataViewDomainService,
    { provide: IDomainServices, useClass: DomainServices },
  ],
  exports: [IDomainServices, PaymentDomainService],
})
export class DomainModule {}
