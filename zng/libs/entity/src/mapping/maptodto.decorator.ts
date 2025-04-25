import { ClassConstructor } from 'class-transformer';
import { DtoMapper } from './dto.mapper';

export function MapToDto<DTO extends object>(dto: ClassConstructor<DTO>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      return DtoMapper.toDto(result, dto);
    };
    return descriptor;
  };
}

/** Decorator to be used with `MapToDtoArray`. */
export function ArrayOf<T>(ctor: ClassConstructor<T>): { type: 'array', itemType: ClassConstructor<T> } {
  return { type: 'array', itemType: ctor };
}

export function MapToDtoArray<DTO extends object>(
  marker: { type: 'array', itemType: ClassConstructor<DTO> }
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      if (Array.isArray(result)) {
        return result.map(item => DtoMapper.toDto(item, marker.itemType));
      }
    };
    return descriptor;
  };
}

