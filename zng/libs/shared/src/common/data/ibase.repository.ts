/*
 * File Name   : ibase.repository.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

export interface IRepositoryBase<Entity> {
  getAll(): Promise<Entity[]>;
  get<T extends keyof Entity>(id: Entity[T]): Promise<Entity | null>;
  create(item: Entity): Promise<Entity>;
  update(id: string, item: Entity): Promise<boolean>;
}
