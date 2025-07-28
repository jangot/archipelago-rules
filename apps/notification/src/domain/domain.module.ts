
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from '../data';
import { IDomainServices } from './domain.iservices';
import { DomainServices } from './domain.services';
import { NotificationDefinitionItemDomainService } from './services/notification.definition.item.service';
import { NotificationDomainService } from './services/notification.definition.service';

@Module({
  imports: [ConfigModule, DataModule],
  providers: [
    NotificationDomainService,
    NotificationDefinitionItemDomainService,
    { provide: IDomainServices, useClass: DomainServices }
  ],
  exports: [IDomainServices],
})
export class DomainModule {}
