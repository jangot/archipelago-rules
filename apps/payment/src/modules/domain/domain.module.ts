import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { BillersModule } from '../billers/billers.module';
import { DataModule } from '../data';
import { DomainServices } from './domain.services';
import { IDomainServices } from './idomain.services';
import { PaymentDomainService } from './services';
import { BillerDomainService } from './services/biller.domain.service';

@Module({
  imports: [
    CqrsModule, 
    ConfigModule, 
    DataModule, 
    JwtModule,
    forwardRef(() => BillersModule),
  ],
  providers: [
    PaymentDomainService,
    BillerDomainService,
    { provide: IDomainServices, useClass: DomainServices },
  ],
  exports: [IDomainServices, PaymentDomainService, BillerDomainService],
})
export class DomainModule {}
