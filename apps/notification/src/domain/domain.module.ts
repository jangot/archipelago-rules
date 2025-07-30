
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from '@notification/data';
import { IDomainServices } from '@notification/domain/domain.iservices';
import { DomainServices } from '@notification/domain/domain.services';
import { NotificationDefinitionItemDomainService } from '@notification/domain/services/notification.definition.item.service';
import { NotificationDomainService } from '@notification/domain/services/notification.definition.service';
import { NotificationLogDomainService } from '@notification/domain/services/notification.log.service';

@Module({
  imports: [ConfigModule, DataModule],
  providers: [
    NotificationDomainService,
    NotificationDefinitionItemDomainService,
    NotificationLogDomainService,
    { provide: IDomainServices, useClass: DomainServices },
  ],
  exports: [IDomainServices, NotificationDomainService],
})
export class DomainModule {}
