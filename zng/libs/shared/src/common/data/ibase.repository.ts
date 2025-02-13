/*
 * File Name   : ibase.repository.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { FindManyOptions, FindOneOptions, FindOptionsWhere } from 'typeorm';
import { CompositeIdEntityType, EntityId, SingleIdEntityType } from './id.entity';

export interface IRepositoryBase<Entity extends EntityId<SingleIdEntityType | CompositeIdEntityType>> {
  getAll(): Promise<Entity[]>;
  create(item: Entity): Promise<Entity>;
  update(id: Entity['id'], item: Entity): Promise<boolean>;

  /**
   * Finds first entity by a given find options. If entity was not found in the database - returns null.
   * @param options https://orkhan.gitbook.io/typeorm/docs/find-options
   * @returns
   */
  findOne(options: FindOneOptions<Entity>): Promise<Entity | null>;
  /**
   * Finds first entity that matches given where condition. If entity was not found in the database - returns null.
   * @param where https://orkhan.gitbook.io/typeorm/docs/find-options
   * @returns
   */
  findOneBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<Entity | null>;
  /**
   * Finds entities that match given find options.
   * @param options https://orkhan.gitbook.io/typeorm/docs/find-options
   * @returns
   */
  find(options: FindManyOptions<Entity>): Promise<Entity[]>;
  /**
   * Finds entities that match given find options.
   * @param where https://orkhan.gitbook.io/typeorm/docs/find-options
   * @returns
   */
  findBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<Entity[]>;
}
