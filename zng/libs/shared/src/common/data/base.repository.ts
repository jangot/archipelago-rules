/*
 * File Name   : base.repository.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { DEFAULT_PAGING_LIMIT } from '../paging/paging.order.constants';
import { AllowedCriteriaTypes, IRepositoryBase } from './ibase.repository';
import {
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  ObjectId,
  RemoveOptions,
  Repository,
  UpdateResult,
} from 'typeorm';
import { CompositeIdEntityType, EntityId, SingleIdEntityType } from './id.entity';
import { SearchFilter } from '../search/search-query';
import { buildSearchQuery } from '../search/entity-search-query';

/**
 * RepositoryBase class
 *
 * @export
 * @class RepositoryBase
 * @implements {IRepositoryBase<Entity>}
 * @template Entity - must support Primary keys (either singular and named id, or composite)
 */
export class RepositoryBase<Entity extends EntityId<SingleIdEntityType | CompositeIdEntityType>>
  implements IRepositoryBase<Entity>
{
  protected readonly repository: Repository<Entity>;

  constructor(protected readonly repo: Repository<Entity>) {
    this.repository = repo;
  }

  public async getAll(): Promise<Entity[]> {
    return await this.repository.find();
  }

  public async create(item: Entity): Promise<Entity> {
    return await this.repository.save(item);
  }

  public async update(id: Entity['id'], item: Entity): Promise<boolean> {
    // Handles Compound Primary keys as well as simple Primary keys
    const whereCondition = this.normalizedIdWhereCondition(id);

    const updateResult = await this.repository.update(whereCondition, item);

    return this.actionResult(updateResult);
  }

  public async findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    return await this.repository.findOne(options);
  }

  public async findOneBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<Entity | null> {
    return await this.repository.findOneBy(where);
  }

  public async find(options: FindManyOptions<Entity>): Promise<Entity[]> {
    // Apply default Paging Limit only if it is not already set
    // As 0 is falsy for number, we need to check if it is undefined
    if (options?.take === undefined) options = { ...options, take: DEFAULT_PAGING_LIMIT };
    return await this.repository.find(options);
  }

  public async findBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<Entity[]> {
    return await this.repository.findBy(where);
  }

  public async delete(
    criteria: string | number | FindOptionsWhere<Entity> | Date | ObjectId | string[] | number[] | Date[] | ObjectId[]
  ): Promise<boolean> {
    // TODO: Should we have separated delete and deleteMany?
    const deleteResult = await this.repository.delete(criteria);
    return this.actionResult(deleteResult);
  }

  public async remove(entities: Entity[], options?: RemoveOptions): Promise<Entity[]>;
  public async remove(entity: Entity, options?: RemoveOptions): Promise<Entity>;
  public async remove(entityOrEntities: Entity | Entity[], options?: RemoveOptions): Promise<Entity | Entity[]> {
    if (Array.isArray(entityOrEntities)) {
      return await this.repository.remove(entityOrEntities, options);
    } else {
      return await this.repository.remove(entityOrEntities, options);
    }
  }

  public async softDelete(criteria: AllowedCriteriaTypes | FindOptionsWhere<Entity>): Promise<boolean> {
    // We should check to ensure the Entity supports Soft Deletes
    const deletedDataColumnMeta = this.repository.metadata.deleteDateColumn;

    if (!deletedDataColumnMeta) {
      throw new Error(
        `Entity ${this.repository.metadata.name} does not support Soft Deletes. Please ensure the Entity has a deleteDateColumn defined.`
      );
    }

    const deleteResult = await this.repository.softDelete(criteria);
    return this.actionResult(deleteResult);
  }

  public async restore(criteria: AllowedCriteriaTypes | FindOptionsWhere<Entity>): Promise<boolean> {
    const restoreResult = await this.repository.restore(criteria);
    return this.actionResult(restoreResult);
  }

  public async search(filters: SearchFilter[]): Promise<Entity[]> {
    const searchQuery = buildSearchQuery<Entity>(filters);
    const result = await this.repository.find({ where: searchQuery });
    return result;
  }

  protected normalizedIdWhereCondition(id: Entity['id']): FindOptionsWhere<Entity> {
    const whereCondition = typeof id === 'object' ? id : { id };

    return whereCondition as FindOptionsWhere<Entity>;
  }

  protected actionResult(result: UpdateResult | DeleteResult): boolean {
    return (result.affected || 0) > 0;
  }
}
