/*
 * File Name   : ibase.repository.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { FindManyOptions, FindOneOptions, FindOptionsWhere, ObjectId, RemoveOptions } from 'typeorm';
import { IPaging, IPagingOptions } from '../paging';
import { ISearchFilter } from '../search';
import { CompositeIdEntityType, EntityId, SingleIdEntityType } from './id.entity';

export type AllowedCriteriaTypes = string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[];

/**
 * Base Repository interface
 *
 * @export
 * @interface IRepositoryBase
 * @template Entity
 */
export interface IRepositoryBase<Entity extends EntityId<SingleIdEntityType | CompositeIdEntityType>> {
  /**
   * Retrieves an entity by its ID.
   *
   * @return {Promise<Entity> | null}
   * @memberof IRepositoryBase
   */
  getById(id: Entity['id']): Promise<Entity | null>;

  /**
   * Returns All Entities
   *
   * @return {Promise<Entity[]>} A Promise resolving to an array of Entities, could be empty.
   * @memberof IRepositoryBase
   */
  getAll(): Promise<Entity[]>;

  /**
   * Fast insert of a new Entity into the DB
   * @param {Entity} item Populated Entity to Insert in the DB
   * @return {Promise<Entity>} Entity with all fields populated inserted in the DB
   * @memberof IRepositoryBase
   */
  insert(item: Partial<Entity>, returnResult: false): Promise<Entity['id'] | null>;
  insert(item: Partial<Entity>, returnResult: true): Promise<Entity | null>;
  insert(item: Partial<Entity>, returnResult?: boolean): Promise<Entity['id'] | Entity | null>;

  /**
   * Fast insert of a new Entity into the DB return the Entity using the RETURNING clause of Postgres
   * @param {Entity} item Populated Entity to Insert in the DB
   * @return {Promise<Entity>} Entity with all fields populated inserted in the DB
   * @memberof IRepositoryBase
   */
  insertWithResult(item: Partial<Entity>): Promise<Entity>;

  /**
   * Creates a new Entity of the given type
   *
   * @param {Entity} item Populated Entity to Create in the DB
   * @return {Promise<Entity>} Entity with all fields populated created in the DB
   * @memberof IRepositoryBase
   */
  create(item: Entity): Promise<Entity>;

  /**
   * Upserts (Insert or Update) an Entity of the given type
   *
   * @param {Entity} item Populated Entity to Upsert in the DB
   * @return {Promise<Entity>} Entity with all fields populated upserted in the DB
   * @memberof IRepositoryBase
   */
  upsert(item: Entity): Promise<Entity>;

  /**
   * Updates an Entity of the given type (it must exist in the DB already)
   *
   * @param {Entity['id']} id
   * @param {Entity} item Populated Entity to Update in the DB
   * @return {Promise<boolean>} Returns true if Entity was successfully update, false otherwise
   * @memberof IRepositoryBase
   */
  update(id: Entity['id'], item: Partial<Entity>): Promise<boolean>;

  /**
   * Updates an Entity of the given type (it must exist in the DB already) and returns the updated Entity
   *
   * @param {Entity['id']} id
   * @param {Entity} item Populated Entity to Update in the DB
   * @return {Promise<Entity>} Returns the updated Entity
   * @memberof IRepositoryBase
   * @see {@link https://orkhan.gitbook.io/typeorm/docs/update-query-builder TypeORM Update Query Builder Documentation}
   */
  updateWithResult(id: Entity['id'], item: Partial<Entity>): Promise<Entity | null>;

  /**
   * Finds the first entity that matches the given search options.
   *
   * @param {FindOneOptions<Entity>} options - Search criteria for finding the entity.
   * @returns {Promise<Entity | null>} A promise resolving to the found entity or `null` if not found.
   * @memberof IRepositoryBase
   * @see {@link https://orkhan.gitbook.io/typeorm/docs/find-options TypeORM Find Options Documentation}
   */
  findOne(options: FindOneOptions<Entity>): Promise<Entity | null>;

  /**
   * Finds first entity that matches given where condition. If entity was not found in the database - returns null.
   *
   * @param {(FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[])} where - Search  criteria for finding the entity.
   * @returns {(Promise<Entity | null>)}  A promise resolving to the found entity or `null` if not found.
   * @memberof IRepositoryBase
   * @see {@link https://orkhan.gitbook.io/typeorm/docs/find-options TypeORM Find Options Documentation}
   */
  findOneBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<Entity | null>;

  /**
   * Finds entities that match given find options.
   *
   * @param {FindManyOptions<Entity>} options - Search  criteria for finding the entities.
   * @returns {Promise<IPaging<Entity>>}  A promise resolving to a paginated array of Entities, could be empty.
   * @memberof IRepositoryBase
   * @see {@link https://orkhan.gitbook.io/typeorm/docs/find-options TypeORM Find Options Documentation}
   */
  find(options: FindManyOptions<Entity>): Promise<IPaging<Entity>>;

  /**
   * Finds entities that match given find options.
   *
   * @param {(FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[])} where - Search  criteria for finding the entities.
   * @param {IPagingOptions} [paging] - Paging options for the search.
   * @returns {Promise<IPaging<Entity>>}  A promise resolving to a paginated array of Entities, could be empty.
   * @memberof IRepositoryBase
   * @see {@link https://orkhan.gitbook.io/typeorm/docs/find-options TypeORM Find Options Documentation}
   */
  findBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[], paging?: IPagingOptions): Promise<IPaging<Entity>>;

  /**
   * Deletes entities by a given criteria.
   * Unlike save method executes a primitive operation without cascades, relations and other operations included.
   * Executes fast and efficient DELETE query.
   * Does not check if entity exist in the database.
   * @param {AllowedCriteriaTypes} criteria - Search criteria for entities to delete.
   * @returns {Promise<boolean>} A promise resolving to `true` if entities were successfully deleted, `false` otherwise.
   * @memberof IRepositoryBase
   * @see {@link https://orkhan.gitbook.io/typeorm/docs/delete-query-builder TypeORM Delete Query Builder Documentation}
   */
  delete(criteria: string | number | FindOptionsWhere<Entity> | Date | string[] | number[] | Date[]): Promise<boolean>;

  /**
   * Removes a given entities from the database.
   * @param {Entity[]} entities - Entities to remove.
   * @param {RemoveOptions} [options] - Additional options.
   * @returns {Promise<Entity[]>} A promise resolving to the removed entities.
   * @memberof IRepositoryBase
   * @see {@link https://orkhan.gitbook.io/typeorm/docs/deletion TypeORM Deletion Documentation}
   */
  remove(entities: Entity[], options?: RemoveOptions): Promise<Entity[]>;

  /**
   * Removes a given entity from the database.
   * @param {Entity} entity - Entity to remove.
   * @param {RemoveOptions} [options] - Additional options.
   * @returns {Promise<Entity>} A promise resolving to the removed entity.
   * @memberof IRepositoryBase
   * @see {@link https://orkhan.gitbook.io/typeorm/docs/deletion TypeORM Deletion Documentation
   */
  remove(entity: Entity, options?: RemoveOptions): Promise<Entity>;

  /**
   * Soft Deletes entities by a given criteria.
   * Unlike save method executes a primitive operation without cascades, relations and other operations included.
   * Executes fast and efficient DELETE query.
   * Does not check if entity exist in the database.
   * @param {(AllowedCriteriaTypes | FindOptionsWhere<Entity>)} criteria - Search criteria for entities to delete.
   * @returns {Promise<boolean>} A promise resolving to `true` if entities were successfully deleted, `false` otherwise.
   * @memberof IRepositoryBase
   * @see {@link https://orkhan.gitbook.io/typeorm/docs/delete-query-builder TypeORM Soft Delete Documentation}
   */
  softDelete(criteria: AllowedCriteriaTypes | FindOptionsWhere<Entity>): Promise<boolean>;

  /**
   * Restores entities by a given criteria.
   * Unlike save method executes a primitive operation without cascades, relations and other operations included.
   * Executes fast and efficient DELETE query.
   * Does not check if entity exist in the database.
   * @param {(AllowedCriteriaTypes | FindOptionsWhere<Entity>)} criteria - Search criteria for entities to delete.
   * @returns {Promise<boolean>} A promise resolving to `true` if entities were successfully deleted, `false` otherwise.
   * @memberof IRepositoryBase
   * @see {@link https://orkhan.gitbook.io/typeorm/docs/delete-query-builder TypeORM Soft Delete Documentation}
   */
  restore(criteria: AllowedCriteriaTypes | FindOptionsWhere<Entity>): Promise<boolean>;

  /**
   * Searches for entities that match the given filters.
   *
   * @param {ISearchFilter[]} filters - Search filters for finding the entities.
   * @param {IPagingOptions} [paging] - Paging options for the search.
   * @returns {Promise<IPaging<Entity>>} A promise resolving to a paginated array of Entities, could be empty.
   * @memberof IRepositoryBase
   */
  search(filters?: ISearchFilter[], paging?: IPagingOptions): Promise<IPaging<Entity>>;

  /**
   * Searches for all entities that match the given filters.
   *
   * @param {ISearchFilter[]} filters - Search filters for finding the entities.
   * @returns {Promise<Entity[]>} A promise resolving to an array of Entities, could be empty.
   * @memberof IRepositoryBase
   */
  searchAll(filters: ISearchFilter[]): Promise<Entity[]>;
}
