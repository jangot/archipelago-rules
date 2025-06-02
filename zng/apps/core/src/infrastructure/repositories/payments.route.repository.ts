import { PaymentsRoute } from '@library/shared/domain/entities/payments.route.entity';
import { PaymentsRouteRelation } from '@library/shared/domain/entities/relations';
import { IPaymentsRouteRepository } from '@core/shared/interfaces/repositories';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { PaymentRouteSearchInput } from '@library/shared/types/lending';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';

@Injectable()
export class PaymentsRouteRepository extends RepositoryBase<PaymentsRoute> implements IPaymentsRouteRepository {
  private readonly logger: Logger = new Logger(PaymentsRouteRepository.name);

  constructor(@InjectRepository(PaymentsRoute) protected readonly repository: Repository<PaymentsRoute>) {
    super(repository, PaymentsRoute);
  }

  findRoute(input: PaymentRouteSearchInput, relations?: PaymentsRouteRelation[]): Promise<PaymentsRoute | null> {
    const { fromAccount, fromOwnership, fromProvider, toAccount, toOwnership, toProvider, loanStage, loanType } = input;
    return this.repository.findOne({ 
      where: { 
        fromAccount, fromOwnership, fromProvider, toAccount, toOwnership, toProvider, 
        loanStagesSupported: ArrayContains([loanStage]), 
        loanTypesSupported: ArrayContains([loanType]), 
      }, 
      relations,
    });
  }
}
