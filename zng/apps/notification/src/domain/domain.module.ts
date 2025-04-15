
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from '../data';
import { NotificationDomainService } from './services/notification.definition.service';
import { DomainServices } from './domain.services';
import { IDomainServices } from './domain.iservices';

@Module({
  imports: [ConfigModule, DataModule],
  providers: [NotificationDomainService, { provide: IDomainServices, useClass: DomainServices }],
  exports: [IDomainServices],
})
export class DomainModule {}
