import { SingleDataSourceConfiguration } from '@library/shared/common/data';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { AllEntities } from '@library/shared/domain/entity';
import { SharedCoreRepositories } from '@library/shared/infrastructure/repository';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentDataService } from './data.service';
import { CustomPaymentRepositories } from './repositories';

@Module({
  imports: [
    // Single connection that can access all schemas
    TypeOrmModule.forRootAsync(SingleDataSourceConfiguration(AllEntities)),
  ],
  providers: [
    PaymentDataService, 
    ...registerCustomRepositoryProviders(AllEntities), 
    ...CustomPaymentRepositories,
    ...SharedCoreRepositories,
  ],
  exports: [PaymentDataService],
})
export class DataModule {}
