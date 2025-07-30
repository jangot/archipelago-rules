import { SingleDataSourceConfiguration } from '@library/shared/common/data';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { SharedDataService } from '@library/shared/common/domainservice/shared.service';
import { AllEntities } from '@library/shared/domain/entity';
import { SharedRepositories } from '@library/shared/infrastructure/repository';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreDataService } from './data.service';
import { CustomCoreRepositories } from './repositories';

@Module({
  imports: [
    // Single connection that can access all schemas
    TypeOrmModule.forRootAsync(SingleDataSourceConfiguration(AllEntities)),
  ],
  providers: [
    CoreDataService,
    SharedDataService,
    ...registerCustomRepositoryProviders(AllEntities), 
    ...CustomCoreRepositories,
    ...SharedRepositories,
  ],
  exports: [CoreDataService, SharedDataService],
})
export class DataModule {}
