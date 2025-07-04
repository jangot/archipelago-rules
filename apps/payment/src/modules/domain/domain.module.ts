import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { DataModule } from '../data';
import { DomainServices } from './domain.services';
import { IDomainServices } from './idomain.services';
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
