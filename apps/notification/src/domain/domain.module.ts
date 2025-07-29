
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from '@notification/data';
import { IDomainServices } from '@notification/domain/domain.iservices';
import { DomainServices } from '@notification/domain/domain.services';
import { NotificationDefinitionItemDomainService } from '@notification/domain/services/notification.definition.item.service';
import { NotificationDomainService } from '@notification/domain/services/notification.definition.service';

@Module({
  imports: [ConfigModule, DataModule],
  providers: [
    NotificationDomainService,
    NotificationDefinitionItemDomainService,
    { provide: IDomainServices, useClass: DomainServices },
  ],
  exports: [IDomainServices],
})
export class DomainModule {}
