export enum SingleValueOperator {
  EQUALS = 'eq',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  IN = 'in',
  LIKE = 'like',
  EMPTY = 'empty',
}

export enum MultiValueOperator {
  BETWEEN = 'bw',
}

export type ValueOperator = SingleValueOperator | MultiValueOperator;
