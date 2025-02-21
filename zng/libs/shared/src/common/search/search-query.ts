import { MultiValueOperator, ValueOperator } from './value-operator';

export type FilterableFieldType = SimpleFieldType | ArrayFieldType;
export type SimpleFieldType = string | number | boolean | Date;
export type ArrayFieldType = string[] | number[] | Date[];

/**
 * Represents a search filter used in a query.
 */
export interface ISearchFilter {
  /**
   * The name of the field to filter on.
   */
  field: string;

  /**
   * The operator to apply to the field.
   * @type {ValueOperator}
   */
  operator: ValueOperator;

  /**
   * The value(s) to apply the operator to.
   */
  value: any | any[];

  /**
   * Optional flag to reverse the condition.
   */
  reverse?: boolean;
}

/**
 * Represents the base search condition interface.
 *
 * @template T - The type of the field value, which extends `FieldType`.
 *
 * @extends ISearchFilter
 */
export interface BaseSearchCondition<T extends FilterableFieldType> extends ISearchFilter {
  /**
   * The operator to apply to the field value.
   */
  operator: ValueOperator;

  /**
   * The value to apply the operator to. Can be a single value or an array of values.
   */
  value: T | T[];
}

/**
 * Represents a search condition that checks if a value is between two specified values.
 *
 * @template T - The type of the values to compare, which can be either a number or a Date.
 * @extends BaseSearchCondition<T>
 *
 * @property {MultiValueOperator.BETWEEN} operator - The operator used for the condition, which is always `BETWEEN`.
 * @property {[T, T]} value - A tuple containing the two values to compare against.
 */
export interface BetweenSearchCondition<T extends number | Date> extends BaseSearchCondition<T> {
  operator: MultiValueOperator.BETWEEN;
  value: [T, T];
}

/**
 * Represents a search condition that can be either a base search condition or a between search condition.
 *
 * @template T - The type of the field, which extends `FieldType`.
 *
 * @see BaseSearchCondition
 * @see BetweenSearchCondition
 */
export type SearchCondition<T extends FilterableFieldType> =
  | BaseSearchCondition<T>
  | BetweenSearchCondition<Extract<T, number | Date>>;
