import { PaymentsRouteRelation } from '@library/shared/domain/entities/relations';
import { IPaymentsRoute } from '@library/entity/interface';
import { IRepositoryBase } from '@library/shared/common/data';
import { PaymentRouteSearchInput } from '@library/shared/types/lending';

 
export interface IPaymentsRouteRepository extends IRepositoryBase<IPaymentsRoute> {
  getRouteById(id: string, relations?: PaymentsRouteRelation[]): Promise<IPaymentsRoute | null>
  findRoute(input: PaymentRouteSearchInput, relations?: PaymentsRouteRelation[]): Promise<IPaymentsRoute | null>;
}

export const IPaymentsRouteRepository = Symbol('IPaymentsRouteRepository');
