import 'reflect-metadata';

const MAP_TO_METADATA_KEY = Symbol('mapTo');
const EXCLUDE_METADATA_KEY = Symbol('excludeFromMapping');

/**
 * Decorator to specify a custom mapping from a DTO field to an Entity field.
 *
 * @export
 * @param {string} entityField - The target field name in the Entity.
 * @return {*}
 */
export function MapTo(entityField: string) {
  return function (target: object, propertyKey: string) {
    Reflect.defineMetadata(MAP_TO_METADATA_KEY, entityField, target, propertyKey);
  };
}

/**
 * Retrieves the mapped field name for a given property.
 *
 * @export
 * @param {object} target
 * @param {string} propertyKey - The property to retrieve the mapped field name from
 * @return {(string | undefined)}
 */
export function getMappedField(target: object, propertyKey: string): string | undefined {
  return Reflect.getMetadata(MAP_TO_METADATA_KEY, target, propertyKey);
}

/**
 * Decorator to exclude a property from DTO-to-Entity mapping.
 *
 * @export
 * @return {*}
 */
export function ExcludeFromMapping() {
  return function (target: object, propertyKey: string) {
    Reflect.defineMetadata(EXCLUDE_METADATA_KEY, true, target, propertyKey);
  };
}

/**
 * Checks if a field is marked with @ExcludeFromMapping
 *
 * @export
 * @param {object} target - class to check
 * @param {string} propertyKey - property to check
 * @return {boolean}
 */
export function isExcludedFromMapping(target: object, propertyKey: string): boolean {
  return Reflect.getMetadata(EXCLUDE_METADATA_KEY, target, propertyKey) === true;
}
