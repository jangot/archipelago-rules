import 'reflect-metadata';

const FIELD_MAPPING_METADATA_KEY = Symbol('fieldMapping');
const EXCLUDE_METADATA_KEY = Symbol('excludeFromMapping');

export interface FieldMappingOptions {
  /**
   * Optional name of the field in the Entity. Only required if mapping to a field of a different name
   */
  entityField?: string;
  /**
   * Optional transformation function to apply to the value.
   */
  transform?: (value: any) => any;
}

/**
 * Decorator to specify a custom mapping from a DTO field to an Entity field,
 * along with an optional transformation function.
 *
 * @param {FieldMappingOptions} options - The mapping options including the target entity field name and an optional transform function.
 */
export function MapTo(options: FieldMappingOptions) {
  return function (target: object, propertyKey: string) {
    Reflect.defineMetadata(FIELD_MAPPING_METADATA_KEY, options, target, propertyKey);
  };
}

/**
 * Retrieves the mapping options for a given property.
 *
 * @param {object} target - The object (typically the DTO prototype)
 * @param {string} propertyKey - The property to retrieve the mapping for.
 * @returns {FieldMappingOptions | undefined} The FieldMappingOptions if defined.
 */
export function getFieldMapping(target: object, propertyKey: string): FieldMappingOptions | undefined {
  return Reflect.getMetadata(FIELD_MAPPING_METADATA_KEY, target, propertyKey);
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
