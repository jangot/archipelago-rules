/*
 * File Name   : dbcommon.config.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Feb 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { ZngNamingStrategy } from '@library/extensions/typeorm/zng-naming.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, EntitySchema, MixedList } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

export const DbSchemaCodes = {
  Core: 'core',
  Payment: 'payments',
  Notification: 'notifications',
} as const;

export type DbSchemaType = (typeof DbSchemaCodes)[keyof typeof DbSchemaCodes];

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export type DatabaseConfigEntities = MixedList<Function | string | EntitySchema>;

export interface DatabaseConfigOptions {
  configService: ConfigService;
  entities?: DatabaseConfigEntities;
  schema?: DbSchemaType;
}

export type BaseDatabaseConfigOptions = Omit<DatabaseConfigOptions, 'configService'>;

// Common Configuration settings across Services
export function DbConfiguration(options: DatabaseConfigOptions): TypeOrmModuleOptions {
  const nodeEnv = options.configService.get<string>('NODE_ENV');
  return {
    type: 'postgres',
    host: options.configService.get<string>('DB_HOST'),
    port: parseInt(options.configService.get<string>('DB_PORT') || '0'),
    username: options.configService.get<string>('DB_USERNAME'),
    password: options.configService.get<string>('DB_PASSWORD'),
    database: options.configService.get<string>('DB_NAME'),
    synchronize: nodeEnv === 'development' || nodeEnv === 'local', // Don't synchronize in Prod!!!
    // New Naming strategy that combines the SnakeNamingStrategy with custom code that does the following:
    // 1. Pluralizes the Table name if using the Entity Class name and not providing a specific name
    // 2. Generates the various constraint (pkey, fkey, key, unique, indexes, default, and exclusion) names that conform to Postgres naming conventions
    namingStrategy: new ZngNamingStrategy(),
    autoLoadEntities: true,
    logging: options.configService.get<string>('TYPE_ORM_LOGGING') === 'true' ? ['query', 'error'] : false,
    entities: options.entities,
    schema: options.schema, // Default schema to use for all entities defined here
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
 * @param options.schema - The database schema to use (optional for single connection)
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
    
      // Build the DataSource and add Transactional support
      const dataSource = addTransactionalDataSource(new DataSource(options));
      // Initialize the DataSource
      await dataSource.initialize();

      // Run pre-initialization SQL

      // Run migrations
      //await dataSource.runMigrations();

      return dataSource;
    },
  };
}

/**
 * Generates TypeORM module configuration for multiple schemas in a single connection.
 * This is the recommended approach for PostgreSQL with multiple schemas.
 * 
 * @param allEntities - All entity classes from all schemas
 * @returns TypeOrmModuleAsyncOptions configured for dependency injection with transaction support
 */
 
export function SingleDataSourceConfiguration(allEntities: DatabaseConfigEntities): TypeOrmModuleAsyncOptions {
  return TypeOrmModuleConfiguration({ entities: allEntities });
}
