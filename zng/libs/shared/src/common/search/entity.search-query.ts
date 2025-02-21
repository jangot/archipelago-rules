import { FilterableFieldType, ISearchFilter } from './search-query';
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
 * @param {ISearchFilter[]} filters - An array of search filters to apply.
 * @returns {FindOptionsWhere<Entity>} - The constructed search query object.
 *
 * @remarks
 * This function groups the filters by their field and then maps each group to the appropriate query condition.
 * If a field has multiple filters, they are combined using an `And` condition.
 */
export function buildSearchQuery<Entity extends ObjectLiteral>(filters?: ISearchFilter[]): FindOptionsWhere<Entity> {
  const searchQuery = {};
  if (!filters || filters.length === 0) return searchQuery;

  // TODO: Make field existance and relation to Entity check on DTO's (?) layer
  const fieldGroups = filters.reduce(
    (groups, filter) => {
      if (!groups[filter.field]) groups[filter.field] = [];
      groups[filter.field].push(filter);
      return groups;
    },
    {} as Record<string, ISearchFilter[]>
  );

  Object.keys(fieldGroups).forEach((field) => {
    const fieldFilters = fieldGroups[field];
    if (fieldFilters.length === 1) {
      searchQuery[field] = mapFilter(fieldFilters[0]);
    } else {
      const mappedFilters = fieldFilters
        .map((filter) => mapFilter(filter))
        .filter((filter) => filter !== null)
        .filter(Boolean);

      searchQuery[field] = And(...mappedFilters);
    }
  });

  return searchQuery;
}

/**
 * Maps a given search filter to a corresponding TypeORM `FindOperator`.
 *
 * @template T - The type of the field being filtered.
 * @param {ISearchFilter} filter - The search filter to map.
 * @returns {FindOperator<T> | null} - The mapped `FindOperator` or `null` if the operator is not supported.
 * @throws {Error} - Throws an error if the operator is unsupported.
 *
 * @example
 * const filter: SearchFilter = { operator: SingleValueOperator.EQUALS, value: 'example' };
 * const result = mapFilter(filter);
 * // result will be an instance of Equal operator with the value 'example'
 */
function mapFilter<T extends FilterableFieldType>(filter: ISearchFilter): FindOperator<T> | null {
  const { operator, value } = filter;
  let mappedOperator: FindOperator<T> | null = null;

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
      if (typeof value === 'string') {
        mappedOperator = ILike(`%${value}%`) as FindOperator<T>;
      }
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
