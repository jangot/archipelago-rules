import { Module } from '@nestjs/common';
import { IDomainServices } from './idomain.services';
import { DomainServices } from './domain.services';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { DataModule } from '@payment/data/data.module';
import { PaymentDomainService } from './services';

@Module({
  imports: [
    CqrsModule, 
    ConfigModule, 
    DataModule, 
    JwtModule,
  ],
  providers: [
    PaymentDomainService,
    { provide: IDomainServices, useClass: DomainServices },
  ],
  exports: [IDomainServices, PaymentDomainService],
})
export class DomainModule {}
