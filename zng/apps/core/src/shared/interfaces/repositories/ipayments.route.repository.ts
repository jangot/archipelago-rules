import { PaymentsRoute } from '@core/domain/entities/payments.route.entity';
import { IRepositoryBase } from '@library/shared/common/data';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IPaymentsRouteRepository extends IRepositoryBase<PaymentsRoute> {}

export const IPaymentsRouteRepository = Symbol('IPaymentsRouteRepository');
