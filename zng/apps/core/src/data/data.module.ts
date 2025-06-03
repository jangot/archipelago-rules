import { Module } from '@nestjs/common';
import { CoreDataService } from './data.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { CustomCoreRepositories } from '../infrastructure/repositories';
import { AllEntities, CoreEntities, PaymentEntities } from '@library/shared/domain/entities';
import { DbSchemaCodes, TypeOrmModuleConfiguration } from '@library/shared/common/data';
import { SharedCoreRepositories } from '@library/shared/infrastructure/repositories';

@Module({
  imports: [
    // schema: core
    TypeOrmModule.forRootAsync(TypeOrmModuleConfiguration({ entities: AllEntities, schema: DbSchemaCodes.Core })),
  ],
  providers: [
    CoreDataService, 
    ...registerCustomRepositoryProviders(CoreEntities), 
    ...registerCustomRepositoryProviders(PaymentEntities),  
    ...CustomCoreRepositories,
    ...SharedCoreRepositories,
  ],
  exports: [CoreDataService],
})
export class DataModule {}
