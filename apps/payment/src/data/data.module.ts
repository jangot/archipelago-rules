import { SingleDataSourceConfiguration } from '@library/shared/common/data';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { CoreEntities, PaymentEntities } from '@library/shared/domain/entity';
import { SharedCoreRepositories } from '@library/shared/infrastructure/repository';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomPaymentRepositories } from '../infrastructure/repositories';
import { PaymentDataService } from './data.service';

@Module({
  imports: [
    // Single connection that can access all schemas
    TypeOrmModule.forRootAsync(SingleDataSourceConfiguration([...CoreEntities, ...PaymentEntities],
      [
        'dist/apps/payment/db/migrations/*.{js,ts}',
        'src/db/migrations/*.ts',
      ]
    )),
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
