import { SingleDataSourceConfiguration } from '@library/shared/common/data';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { AllEntities } from '@library/shared/domain/entity';
import { SharedRepositories } from '@library/shared/infrastructure/repository';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentDataService } from './data.service';
import { CustomPaymentRepositories } from './repositories';
import { SharedDataService } from '@library/shared/common/domainservice/shared.service';

@Module({
  imports: [
    // Single connection that can access all schemas
    TypeOrmModule.forRootAsync(SingleDataSourceConfiguration(AllEntities)),
  ],
  providers: [
    PaymentDataService,
    SharedDataService,
    ...registerCustomRepositoryProviders(AllEntities),
    ...CustomPaymentRepositories,
    ...SharedRepositories,
  ],
  exports: [PaymentDataService, SharedDataService],
})
export class DataModule {}
