import { SearchFiler } from './search-query';
import { SingleValueOperator, MultiValueOperator } from './value-operator';
import {
  And,
  Between,
  Equal,
  FindOperator,
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  LessThan,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
  Not,
  ObjectLiteral,
} from 'typeorm';

/**
 * Builds a search query object based on the provided filters.
 *
 * @template Entity - The type of the entity for which the search query is being built.
 * @param {SearchFiler[]} filters - An array of search filters to apply.
 * @returns {FindOptionsWhere<Entity>} - The constructed search query object.
 *
 * @remarks
 * This function groups the filters by their field and then maps each group to the appropriate query condition.
 * If a field has multiple filters, they are combined using an `And` condition.
 */
export function buildSearchQuery<Entity extends ObjectLiteral>(filters: SearchFiler[]): FindOptionsWhere<Entity> {
  // TODO: Make field existance and relation to Entity check on DTO's (?) layer
  const fieldGroups = filters.reduce(
    (groups, filter) => {
      if (!groups[filter.field]) groups[filter.field] = [];
      groups[filter.field].push(filter);
      return groups;
    },
    {} as Record<string, SearchFiler[]>
  );

  const searchQuery = {};

  Object.keys(fieldGroups).forEach((field) => {
    const fieldFilters = fieldGroups[field];
    if (fieldFilters.length === 1) {
      searchQuery[field] = mapFilter(fieldFilters[0]);
    } else {
      const mappedFilters = fieldFilters.map((filter) => mapFilter(filter)).filter(Boolean);
      searchQuery[field] = And(...mappedFilters);
    }
  });

  return searchQuery;
}

/**
 * Maps a given filter to a corresponding TypeORM `FindOperator`.
 *
 * @param {SearchFiler} filter - The filter object containing the operator and value to be mapped.
 * @param {SingleValueOperator | MultiValueOperator} filter.operator - The operator to be used for filtering.
 * @param {unknown} filter.value - The value to be used with the operator.
 * @param {boolean} [filter.reverse] - Optional flag to reverse the filter condition.
 * @returns {FindOperator<unknown>} The mapped TypeORM `FindOperator`.
 * @throws {Error} If the operator is unsupported.
 *
 * @typedef {Object} SearchFiler
 * @property {SingleValueOperator | MultiValueOperator} operator - The operator to be used for filtering.
 * @property {unknown} value - The value to be used with the operator.
 * @property {boolean} [reverse] - Optional flag to reverse the filter condition.
 *
 * @typedef {('EQUALS' | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL' | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 'IN' | 'LIKE' | 'EMPTY')} SingleValueOperator
 * @typedef {('BETWEEN')} MultiValueOperator
 */
function mapFilter(filter: SearchFiler): FindOperator<unknown> {
  const { operator, value } = filter;
  let mappedOperator: FindOperator<unknown>;
  switch (operator) {
    case SingleValueOperator.EQUALS:
      mappedOperator = Equal(value);
      break;
    case SingleValueOperator.GREATER_THAN:
      mappedOperator = MoreThan(value);
      break;
    case SingleValueOperator.GREATER_THAN_OR_EQUAL:
      mappedOperator = MoreThanOrEqual(value);
      break;
    case SingleValueOperator.LESS_THAN:
      mappedOperator = LessThan(value);
      break;
    case SingleValueOperator.LESS_THAN_OR_EQUAL:
      mappedOperator = LessThanOrEqual(value);
      break;
    case SingleValueOperator.IN:
      if (Array.isArray(value)) {
        mappedOperator = In(value);
      }
      break;
    case SingleValueOperator.LIKE:
      mappedOperator = ILike(`%${value}%`);
      break;
    case SingleValueOperator.EMPTY:
      mappedOperator = IsNull();
      break;
    case MultiValueOperator.BETWEEN:
      mappedOperator = Between(value[0], value[1]);
      break;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
  if (filter.reverse === true && mappedOperator) {
    mappedOperator = Not(mappedOperator);
  }
  return mappedOperator;
}
