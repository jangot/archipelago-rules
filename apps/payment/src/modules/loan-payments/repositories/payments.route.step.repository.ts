import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { PaymentsRouteStep } from '@library/shared/domain/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentsRouteStepRepository extends RepositoryBase<PaymentsRouteStep> {
  private readonly logger: Logger = new Logger(PaymentsRouteStepRepository.name);

  constructor(@InjectRepository(PaymentsRouteStep) protected readonly repository: Repository<PaymentsRouteStep>) {
    super(repository, PaymentsRouteStep);
  }
}
