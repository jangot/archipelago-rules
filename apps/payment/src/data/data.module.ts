import { Module } from '@nestjs/common';
import { PaymentDataService } from './data.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { CustomPaymentRepositories } from '../infrastructure/repositories';
import { CoreEntities, PaymentEntities } from '@library/shared/domain/entity';
import { SingleDataSourceConfiguration } from '@library/shared/common/data';
import { SharedCoreRepositories } from '@library/shared/infrastructure/repository';

@Module({
  imports: [
    // Single connection that can access all schemas
    TypeOrmModule.forRootAsync(SingleDataSourceConfiguration([...CoreEntities, ...PaymentEntities])),
  ],
  providers: [
    PaymentDataService, 
    ...registerCustomRepositoryProviders(CoreEntities), 
    ...registerCustomRepositoryProviders(PaymentEntities),  
    ...CustomPaymentRepositories,
    ...SharedCoreRepositories,
  ],
  exports: [PaymentDataService],
})
export class DataModule {}
