export const PAYMENTS_ROUTE_RELATIONS = {
  Steps: 'steps',
} as const;

export type PaymentsRouteRelation = (typeof PAYMENTS_ROUTE_RELATIONS)[keyof typeof PAYMENTS_ROUTE_RELATIONS];
