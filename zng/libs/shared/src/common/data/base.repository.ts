/*
 * File Name   : base.repository.ts
 * Author      : Michael LeDuc
 * Created Date: Tue Feb 04 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { AllowedCriteriaTypes, IRepositoryBase } from './ibase.repository';
import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  ObjectId,
  RemoveOptions,
  Repository,
  UpdateResult,
} from 'typeorm';
import { CompositeIdEntityType, EntityId, SingleIdEntityType } from './id.entity';
import { ISearchFilter } from '../search/search-query';
import { buildPagingQuery, IPaging, IPagingOptions } from '../paging';
import { buildSearchQuery } from '../search';
import { IDatabaseConnection, PreparedQuery } from '@pgtyped/runtime';
import { Pool } from 'pg';
import { PgPoolAdapter } from './pg-pool-adapter';
import camelcaseKeys from 'camelcase-keys';

/**
 * RepositoryBase class
 *
 * @export
 * @class RepositoryBase
 * @implements {IRepositoryBase<Entity>}
 * @template Entity - must support Primary keys (either singular and named id, or composite)
 */
export class RepositoryBase<Entity extends EntityId<SingleIdEntityType | CompositeIdEntityType>> implements IRepositoryBase<Entity> {
  protected readonly repository: Repository<Entity>;

  constructor(
    protected readonly repo: Repository<Entity>,
    private readonly entityClass: { new (...args: any[]): Entity } // Ensures entityClass can be instantiated
  ) {
    this.repository = repo;
  }

  public async getById(id: Entity['id']): Promise<Entity | null> {
    const whereCondition = this.normalizedIdWhereCondition(id);
    const result = await this.findOneBy(whereCondition);

    return result;
  }

  public async getAll(): Promise<Entity[]> {
    return await this.repository.find();
  }

  public async insert(item: DeepPartial<Entity>, returnResult: false): Promise<Entity['id'] | null>;
  public async insert(item: DeepPartial<Entity>, returnResult: true): Promise<Entity | null>;
  public async insert(item: DeepPartial<Entity>, returnResult: boolean = false): Promise<Entity['id'] | Entity | null> {
    if (returnResult) {
      return await this.insertWithResult(item);
    }

    const insertResult = await this.repository.insert(item);
    const id = insertResult.identifiers[0].id;
    return id;
  }

  public async insertWithResult(item: DeepPartial<Entity>): Promise<Entity> {
    const insertResult = await this.repository
      .createQueryBuilder()
      .insert()
      .into(this.repository.metadata.target)
      .values(item)
      .returning('*')
      .execute();

    if (!insertResult.generatedMaps || insertResult.generatedMaps.length === 0) {
      throw new Error('Insert failed: no entity was returned');
    }
    // generatedMaps[0] will have keys matching entity's properties (camelCased)
    return insertResult.generatedMaps[0] as Entity;
  }

  public async create(item: DeepPartial<Entity>): Promise<Entity> {
    return await this.repository.save(item);
  }

  public async update(id: Entity['id'], item: DeepPartial<Entity>): Promise<boolean> {
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

  public async find(options: FindManyOptions<Entity>): Promise<IPaging<Entity>> {
    // For now lets support only single field order
    let orderKey;
    let orderDirection;
    if (options.order) {
      const order = options.order as FindOptionsOrder<Entity>;
      const orderKeys = Object.keys(order);
      orderKey = orderKeys[0];
      orderDirection = order[orderKey];
    }
    // Apply default Paging only if it is not already set
    const searchPaging = buildPagingQuery<Entity>({ limit: options?.take, offset: options?.skip, order: orderDirection, orderBy: orderKey });
    const { skip, take } = searchPaging;
    options = { ...options, ...searchPaging };
    const result = await this.repository.findAndCount(options);
    return { data: result[0], meta: { offset: skip, limit: take, totalCount: result[1] } };
  }

  public async findBy(where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[], paging?: IPagingOptions): Promise<IPaging<Entity>> {
    const searchPaging = buildPagingQuery<Entity>(paging);
    const { skip, take } = searchPaging;
    const result = await this.repository.findAndCount({ where, ...searchPaging });
    return { data: result[0], meta: { offset: skip, limit: take, totalCount: result[1] } };
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

  public async search(filters?: ISearchFilter[], paging?: IPagingOptions): Promise<IPaging<Entity>> {
    let correctFilters = filters || [];
    if (filters) correctFilters = filters.filter((f) => this.isFieldFilterable(f.field));
    const searchQuery = buildSearchQuery<Entity>(correctFilters);
    const searchPaging = buildPagingQuery<Entity>(paging);
    const { skip, take } = searchPaging;
    const result = await this.repository.findAndCount({ where: searchQuery, ...searchPaging });
    return { data: result[0], meta: { offset: skip, limit: take, totalCount: result[1] } };
  }

  public async searchAll(filters: ISearchFilter[]): Promise<Entity[]> {
    const searchQuery = buildSearchQuery<Entity>(filters);
    const result = await this.repository.find({ where: searchQuery });
    return result;
  }

  //#region pgtyped specific code
  // Caution: This code is brittle as it makes use of underlying TypeORM internals
  // to get access to the underlying pg Pool for reuse with pgtyped
  // a new release of TypeORM could break this!
  protected getIDatabaseConnection(): IDatabaseConnection {
    const dataSource = this.repository.manager.connection;
    const pool = (dataSource.driver as any).master as Pool;
    const poolAdapter = new PgPoolAdapter(pool);

    return poolAdapter;
  }

  // Return only 1 record from the query
  protected async runSqlQuerySingle<TParamType, TResultType extends Record<string, any>>(
    params: TParamType,
    query: PreparedQuery<TParamType, TResultType>
  ): Promise<TResultType | null> {
    const results = await this.runSqlQuery(params, query);
    const result = results && results.length > 0 ? results[0] : null;

    return result;
  }

  protected async runSqlQuery<TParamType, TResultType extends Record<string, any>>(
    params: TParamType,
    query: PreparedQuery<TParamType, TResultType>
  ): Promise<TResultType[]> {
    const databaseConnection = this.getIDatabaseConnection();

    const rawResult = await query.run(params, databaseConnection);
    const result = camelcaseKeys(rawResult, { deep: true }) as TResultType[];

    return result;
  }

  protected async runSqlQueryWithCount<TParamType, TResultType extends Record<string, any>>(
    params: TParamType,
    query: PreparedQuery<TParamType, TResultType>
  ): Promise<{ result: Array<TResultType>; rowCount: number }> {
    const databaseConnection = this.getIDatabaseConnection();

    const rawResult = await query.runWithCounts(params, databaseConnection);
    const result = camelcaseKeys(rawResult, { deep: true }) as { result: Array<TResultType>; rowCount: number };

    return result;
  }
  //#endregion

  protected normalizedIdWhereCondition(id: Entity['id']): FindOptionsWhere<Entity> {
    const whereCondition = typeof id === 'object' ? id : { id };

    return whereCondition as FindOptionsWhere<Entity>;
  }

  protected actionResult(result: UpdateResult | DeleteResult): boolean {
    return (result.affected || 0) > 0;
  }

  /**
   * Function to check if the field of the Entity is filterable.
   * If returns false, the field will be ignored in the search query.
   * @param {String} field - Field name to check
   * @returns {Boolean} - True if the field is filterable, false otherwise
   */
  protected isFieldFilterable(field: string): boolean {
    const entityInstance = this.getEntityInstance();

    return Object.keys(entityInstance).includes(field);
  }

  private getEntityInstance(): Entity {
    return new this.entityClass();
  }
}
