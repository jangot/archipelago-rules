import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { CustomCoreRepositories } from './repositories';
import { AllEntities, CoreEntities, PaymentEntities } from '@library/shared/domain/entity';
import { SingleDataSourceConfiguration } from '@library/shared/common/data';
import { SharedCoreRepositories } from '@library/shared/infrastructure/repository';
import { CoreDataService } from './data.service';

@Module({
  imports: [
    // Single connection that can access all schemas
    TypeOrmModule.forRootAsync(SingleDataSourceConfiguration(AllEntities)),
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
