import { Module } from '@nestjs/common';
import { CoreDataService } from './data.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { CustomCoreRepositories } from '../infrastructure/repositories';
import { CoreEntities, PaymentEntities } from '@library/shared/domain/entities';
import { DbSchemaCodes, TypeOrmModuleConfiguration } from '@library/shared/common/data';

@Module({
  imports: [
    // schema: core
    TypeOrmModule.forRootAsync(TypeOrmModuleConfiguration({ entities: CoreEntities, schema: DbSchemaCodes.Core })),
    // schema: payment
    TypeOrmModule.forRootAsync(TypeOrmModuleConfiguration({ entities: PaymentEntities, schema: DbSchemaCodes.Payment })),
  ],
  providers: [ // TODO: split repositories
    CoreDataService, 
    ...registerCustomRepositoryProviders(CoreEntities), 
    ...registerCustomRepositoryProviders(PaymentEntities),  
    ...CustomCoreRepositories,
  ],
  exports: [CoreDataService],
})
export class DataModule {}
