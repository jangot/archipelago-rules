import { Module } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { CustomCoreRepositories } from './repositories';
import { AllEntities, CoreEntities, LoanApplication, PaymentEntities } from '@library/shared/domain/entity';
import { SingleDataSourceConfiguration } from '@library/shared/common/data';
import { SharedCoreRepositories } from '@library/shared/infrastructure/repository';
import { CoreDataService } from './data.service';
import { Repository } from 'typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';

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
    {
      provide: 'LoanApplicationBaseRepository',
      useFactory: (repo: Repository<LoanApplication>) =>
        new RepositoryBase<LoanApplication>(repo, LoanApplication),
      inject: [getRepositoryToken(LoanApplication)],
    },
  ],
  exports: [CoreDataService, 'LoanApplicationBaseRepository'],
})
export class DataModule {}
