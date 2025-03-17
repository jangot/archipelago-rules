import { Module } from '@nestjs/common';
import { IDomainServices } from './idomain.services';
import { DomainServices } from './domain.services';
import { DataModule } from '../data';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { UserDomainService } from './services/user.domain.service';

@Module({
  imports: [CqrsModule, ConfigModule, DataModule],
  providers: [UserDomainService, { provide: IDomainServices, useClass: DomainServices }],
  exports: [IDomainServices],
})
export class DomainModule {}
