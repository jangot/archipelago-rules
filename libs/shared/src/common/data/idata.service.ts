/*
 * File Name   : idata.service.ts
 * Author      : Michael LeDuc
 * Created Date: Thu Apr 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { CompositeIdEntityType, EntityId, SingleIdEntityType } from './id.entity';
import { IRepositoryBase } from './ibase.repository';

/**
 * Abstract base class for data services providing TypeORM repository access
 */
export abstract class IDataService {
  // Any property (key) must be a TypeORM Repository reference.
  [key: string]: IRepositoryBase<EntityId<SingleIdEntityType | CompositeIdEntityType>>;
}
