/*
 * File Name   : dbcommon.config.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Feb 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ZngNamingStrategy } from '@library/extensions/typeorm/zng-naming.strategy';
import { DataSource, EntitySchema, MixedList } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

export const DbSchemaCodes = {
  Core: 'core',
  Payment: 'payment',
  Notification: 'notification',
} as const;

export type DbSchemaType = (typeof DbSchemaCodes)[keyof typeof DbSchemaCodes];

export interface DatabaseConfigOptions {
  configService: ConfigService;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  entities?: MixedList<Function | string | EntitySchema>;
  schema?: DbSchemaType;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  migrations?: MixedList<Function | string>;
}

export type BaseDatabaseConfigOptions = Omit<DatabaseConfigOptions, 'configService'>;

// Common Configuration settings across Services
export function DbConfiguration(options: DatabaseConfigOptions): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: options.configService.get<string>('DB_HOST'),
    port: parseInt(options.configService.get<string>('DB_PORT') || '0'),
    username: options.configService.get<string>('DB_USERNAME'),
    password: options.configService.get<string>('DB_PASSWORD'),
    database: options.configService.get<string>('DB_NAME'),
    synchronize: options.configService.get<string>('NODE_ENV') === 'development', // Don't synchronize in Prod!!!
    // New Naming strategy that combines the SnakeNamingStrategy with custom code that does the following:
    // 1. Pluralizes the Table name if using the Entity Class name and not providing a specific name
    // 2. Generates the various constraint (pkey, fkey, key, unique, indexes, default, and exclusion) names that conform to Postgres naming conventions
    namingStrategy: new ZngNamingStrategy(),
    autoLoadEntities: true,
    logging: options.configService.get<string>('TYPE_ORM_LOGGING') === 'true' ? ['query', 'error'] : false,
    entities: options.entities,
    schema: options.schema, // Default schema to use for all entities defined here
    migrations: options.migrations,
  };
}

// 
/**
 * Generates TypeORM module configuration for async database connections.
 * 
 * This function creates a TypeORM module configuration that uses the ConfigService
 * to retrieve database connection parameters at runtime. It also sets up
 * transactional data source support using the TypeORM Transactional decorator library.
 * 
 * @param options - The database configuration options
 * @param options.entities - The entity classes to be included in the connection
 * @param options.schema - The database schema to use
 * @returns TypeOrmModuleAsyncOptions configured for dependency injection with transaction support
 * @throws Error if no datasource options are provided during initialization
 */
export function TypeOrmModuleConfiguration(options: BaseDatabaseConfigOptions): TypeOrmModuleAsyncOptions {
  const { entities, schema } = options;
  return {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => DbConfiguration({ configService, entities, schema }),
    // TypeORM Transactional DataSource initialization
    async dataSourceFactory(options) {
      if (!options) {
        throw new Error('No Datasource options for TypeOrmModule provided');
      }
    
      return addTransactionalDataSource(new DataSource(options));
    },
  };
}
