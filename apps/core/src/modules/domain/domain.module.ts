import { Module } from '@nestjs/common';
import { IDomainServices } from './idomain.services';
import { DomainServices } from './domain.services';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { UserDomainService, LoanDomainService, LoanApplicationDomainService } from './services';
import { DataModule } from '../data';

@Module({
  imports: [CqrsModule, ConfigModule, DataModule, JwtModule],
  providers: [
    UserDomainService, 
    LoanDomainService, 
    LoanApplicationDomainService,
    { provide: IDomainServices, useClass: DomainServices }],
  exports: [IDomainServices],
})
export class DomainModule {}
