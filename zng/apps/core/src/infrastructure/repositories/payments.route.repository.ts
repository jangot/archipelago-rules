import { PaymentsRoute } from '@core/domain/entities/payments.route.entity';
import { IPaymentsRouteRepository } from '@core/shared/interfaces/repositories';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export class PaymentsRouteRepository extends RepositoryBase<PaymentsRoute> implements IPaymentsRouteRepository {
  private readonly logger: Logger = new Logger(PaymentsRouteRepository.name);

  constructor(@InjectRepository(PaymentsRoute) protected readonly repository: Repository<PaymentsRoute>) {
    super(repository, PaymentsRoute);
  }
}
