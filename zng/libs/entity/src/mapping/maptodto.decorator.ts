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
