import { FieldMappingOptions, getFieldMapping, isExcludedFromMapping } from './mapping.decorators';

export class MetadataCache {
  private static cache = new Map<string, MetadataInfo>();

  public static getMetadata<T extends object>(classType: new () => T): MetadataInfo {
    const className = classType.name;
    if (!this.cache.has(className)) {
      this.cache.set(className, this.extractMetadata(classType));
    }
    return this.cache.get(className)!;
  }

  private static extractMetadata<T extends object>(classType: new () => T): MetadataInfo {
    const instance = new classType();
    const metadata: MetadataInfo = {
      mappings: new Map(),
      excludedFields: new Set(),
      types: new Map(),
    };

    for (const key of Object.keys(instance)) {
      // Check for @MapTo()
      const mappedField = getFieldMapping(instance, key);
      if (mappedField) {
        metadata.mappings.set(key, mappedField);
      }

      // Check for @ExcludeFromMapping()
      if (isExcludedFromMapping(instance, key)) {
        metadata.excludedFields.add(key);
      }

      // Get the expected type
      const targetType = Reflect.getMetadata('design:type', instance, key);
      if (targetType) {
        metadata.types.set(key, targetType);
      }
    }

    return metadata;
  }
}

export interface MetadataInfo {
  mappings: Map<string, FieldMappingOptions>; // DTO -> Entity field mappings
  excludedFields: Set<string>; // Fields to exclude
  types: Map<string, any>; // Expected types
}
