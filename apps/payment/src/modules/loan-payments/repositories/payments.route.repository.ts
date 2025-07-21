import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { PaymentsRoute } from '@library/shared/domain/entity/payments.route.entity';
import { PaymentsRouteRelation } from '@library/shared/domain/entity/relation';
import { PaymentRouteSearchInput } from '@library/shared/type/lending';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';

@Injectable()
export class PaymentsRouteRepository extends RepositoryBase<PaymentsRoute> {
  private readonly logger: Logger = new Logger(PaymentsRouteRepository.name);
  constructor(@InjectRepository(PaymentsRoute) protected readonly repository: Repository<PaymentsRoute>) {
    super(repository, PaymentsRoute);
  }

  getRouteById(id: string, relations?: PaymentsRouteRelation[]): Promise<PaymentsRoute | null> {
    return this.repository.findOne({ where: { id }, relations });
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
