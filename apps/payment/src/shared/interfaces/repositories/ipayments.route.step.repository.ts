import { PaymentsRouteStep } from '@library/shared/domain/entity';
import { IRepositoryBase } from '@library/shared/common/data';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IPaymentsRouteStepRepository extends IRepositoryBase<PaymentsRouteStep> {}

export const IPaymentsRouteStepRepository = Symbol('IPaymentsRouteStepRepository');
