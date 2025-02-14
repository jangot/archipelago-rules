import { MetadataCache } from './metadata.cache';
import { TypeConverter } from './type.converter';

export class EntityMapper {
  /**
   * Creates a new Entity instance from a DTO
   *
   * @static
   * @template DTO - object
   * @template Entity - object
   * @param {DTO} dto - DTO object with values to copy into the entity
   * @param {new () => Entity} entityClass - Entity class to create
   * @return {Entity} - New Entity with DTO object values copied into it
   * @memberof EntityMapper
   */
  public static toEntity<DTO extends object, Entity extends object>(dto: DTO, entityClass: new () => Entity): Entity {
    const entity = new entityClass();
    const metadata = MetadataCache.getMetadata(entityClass);

    for (const key of Object.keys(dto)) {
      if (metadata.excludedFields.has(key)) continue;

      const mappedField = metadata.mappings.get(key) || key;
      const targetType = metadata.types.get(mappedField);

      (entity as any)[mappedField] = TypeConverter.convert((dto as any)[key], targetType);
    }

    return entity;
  }

  /**
   * Merges Partial<DTO> values into provided Entity instance
   *
   * @static
   * @template DTO - object
   * @template Entity - object
   * @param {Partial<DTO>} dto - Partial DTO object with a subset of values to merge with the entity
   * @param {Entity} entity - Current Entity loaded from DB
   * @return {Entity} - Combined values of the Partial<DTO> and the Entity
   * @memberof EntityMapper
   */
  public static toEntityPartial<DTO extends object, Entity extends object>(dto: Partial<DTO>, entity: Entity): Entity {
    const metadata = MetadataCache.getMetadata(entity.constructor as new () => Entity);

    for (const key of Object.keys(dto)) {
      if (metadata.excludedFields.has(key)) continue;

      const mappedField = metadata.mappings.get(key) || key;
      const targetType = metadata.types.get(mappedField);

      (entity as any)[mappedField] = TypeConverter.convert((dto as any)[key], targetType);
    }

    return entity;
  }
}
