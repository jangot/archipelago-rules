/*
 * File Name   : base.repository.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { DEFAULT_PAGING_LIMIT } from '../paging/paging.order.constants';
import { IRepositoryBase } from './ibase.repository';
import { FindManyOptions, FindOneOptions, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';

export class RepositoryBase<Entity extends ObjectLiteral> implements IRepositoryBase<Entity> {
  protected readonly repository: Repository<Entity>;

  constructor(
    protected readonly repo: Repository<Entity>
  ) {
    this.repository = repo;
  }

  public async getAll(): Promise<Entity[]> {
    return await this.repository.find();
  }

  public async create(item: Entity): Promise<Entity> {
    return await this.repository.save(item);
  }

  public async update(id: string, item: Entity): Promise<boolean> {
    const updateResult = await this.repository.update(id, item);

    return (updateResult.affected || 0) > 0;
  }

  public async findOne(options: FindOneOptions<Entity>): Promise<Entity | null> {
    return await this.repository.findOne(options);
  }

  public async findOneBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<Entity | null> {
    return await this.repository.findOneBy(where);
  }

  public async find(options: FindManyOptions<Entity>): Promise<Entity[]> {
    if (!options?.take) options = { ...options, take: DEFAULT_PAGING_LIMIT };
    return await this.repository.find(options);
  }

  public async findBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]): Promise<Entity[]> {
    return await this.repository.findBy(where);
  }
}
