/*
 * File Name   : registration.repository.ts
 * Author      : Michael LeDuc
 * Created Date: Fri Feb 07 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { DataSource } from 'typeorm';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { Provider } from '@nestjs/common';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

// Function to generate custom repository providers dynamically
function createRepositoryProvider(entity: EntityClassOrSchema) {
  return {
    provide: getRepositoryToken(entity),
    inject: [getDataSourceToken()],
    useFactory: (dataSource: DataSource) => dataSource.getRepository(entity),
  };
}

export function registerCustomRepositoryProviders(entities: EntityClassOrSchema[]): Provider[] {
  if (!entities || entities.length === 0) {
    return [];
  }

  const result = entities.map(createRepositoryProvider);

  return result;
}
