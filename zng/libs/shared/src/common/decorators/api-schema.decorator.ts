/*
 * File Name   : api-schema.decorator.ts
 * Author      : Michael LeDuc
 * Created Date: Fri Mar 07 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */
type Constructor<T = object> = new (...args: any[]) => T;
type Wrapper<T = object> = { new (): T & any; prototype: T };
type DecoratorOptions = { name: string };
type ApiSchemaDecorator = <T extends Constructor>(options: DecoratorOptions) => (constructor: T) => Wrapper<T>;

export const ApiSchema: ApiSchemaDecorator = ({ name }) => {
  return (constructor) => {
    const wrapper = class extends constructor {};
    Object.defineProperty(wrapper, 'name', {
      value: name,
      writable: false,
    });
    return wrapper;
  };
};
