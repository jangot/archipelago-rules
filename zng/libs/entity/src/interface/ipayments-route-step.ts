import { EntityId } from '@library/shared/common/data';
import { IPaymentsRoute } from './ipayments-route';
import { IPaymentAccount } from './ipayment-account';

export interface IPaymentsRouteStep extends EntityId<string> {
  /** Unique identifier for the payments route step (UUID).*/
  id: string;

  /** Foreign key referencing the associated route.*/
  routeId: string;
  /** Payments Route containing this Step */
  route: IPaymentsRoute;

  /** Order of the route element in the chain.*/
  order: number;

  /** Identifier of the source payment account if it is pre-defined (e.g. Zirtue Internal For Checkbook ACH Funding).*/
  fromId: string | null;
  from: IPaymentAccount | null;

  /** Identifier of the destination payment account if it is pre-defined (e.g. Zirtue Internal For Checkbook ACH Funding).*/
  toId: string | null;
  to: IPaymentAccount | null;
}
