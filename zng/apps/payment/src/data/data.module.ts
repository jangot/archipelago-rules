import { Module } from '@nestjs/common';
import { PaymentDataService } from './data.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { registerCustomRepositoryProviders } from '@library/shared/common/data/registration.repository';
import { CustomPaymentRepositories } from '../infrastructure/repositories';
import { AllEntities, CoreEntities, PaymentEntities } from '@library/shared/domain/entities';
import { DbSchemaCodes, TypeOrmModuleConfiguration } from '@library/shared/common/data';
import { SharedCoreRepositories } from '@library/shared/infrastructure/repositories';

@Module({
  imports: [
    // schema: payment
    TypeOrmModule.forRootAsync(TypeOrmModuleConfiguration({ entities: AllEntities, schema: DbSchemaCodes.Payment })),
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
