import { PaymentsRouteStep } from '@core/domain/entities';
import { IPaymentsRouteStepRepository } from '@core/shared/interfaces/repositories';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class PaymentsRouteStepRepository extends RepositoryBase<PaymentsRouteStep> implements IPaymentsRouteStepRepository {
  private readonly logger: Logger = new Logger(PaymentsRouteStepRepository.name);

  constructor(@InjectRepository(PaymentsRouteStep) protected readonly repository: Repository<PaymentsRouteStep>) {
    super(repository, PaymentsRouteStep);
  }
}
