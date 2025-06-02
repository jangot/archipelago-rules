import { PaymentsRouteStep } from '@library/shared/domain/entities';
import { IPaymentsRouteStepRepository } from '@core/shared/interfaces/repositories';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentsRouteStepRepository extends RepositoryBase<PaymentsRouteStep> implements IPaymentsRouteStepRepository {
  private readonly logger: Logger = new Logger(PaymentsRouteStepRepository.name);

  constructor(@InjectRepository(PaymentsRouteStep) protected readonly repository: Repository<PaymentsRouteStep>) {
    super(repository, PaymentsRouteStep);
  }
}
