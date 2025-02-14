/*
 * File Name   : base.repository.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { DEFAULT_PAGING_LIMIT } from '../paging/paging.order.constants';
import { IRepositoryBase } from './ibase.repository';
import { FindManyOptions, FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { CompositeIdEntityType, EntityId, SingleIdEntityType } from './id.entity';

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

    return (updateResult.affected || 0) > 0;
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

  protected normalizedIdWhereCondition(id: Entity['id']): FindOptionsWhere<Entity> {
    const whereCondition = typeof id === 'object' ? id : { id };

    return whereCondition as FindOptionsWhere<Entity>;
  }
}
