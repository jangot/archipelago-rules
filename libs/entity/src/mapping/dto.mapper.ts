import { ClassConstructor, plainToInstance } from 'class-transformer';

export class DtoMapper {
  /**
   * Map Entity Object to DTO for returning to external callers
   *
   * @static
   * @template Entity - object
   * @template DTO - object
   * @param {Entity} entity - Entity from Data store
   * @param {ClassConstructor<DTO>} dtoClass - DTO class constructor
   * @return {(DTO | null)} - returns new DTO instance or null
   * @memberof DtoMapper
   */
  public static toDto<Entity extends object, DTO extends object>(entity: Entity | null, dtoClass: ClassConstructor<DTO>): DTO | null {
    if (!entity) {
      return null;
    }

    const result: DTO = plainToInstance(dtoClass, entity, { excludeExtraneousValues: true });

    return result;
  }

  public static toDtoArray<Entity extends object, DTO extends object>(entity: Entity[] | null, dtoClass: ClassConstructor<DTO>): DTO[] | null {
    if (!entity) {
      return null;
    }

    const result: DTO[] = plainToInstance(dtoClass, entity, { excludeExtraneousValues: true });

    return result;
  }
}
