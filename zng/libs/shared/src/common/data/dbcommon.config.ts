/*
 * File Name   : dbcommon.config.ts
 * Author      : Michael LeDuc
 * Created Date: Mon Feb 10 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ZngNamingStrategy } from '@library/extensions/typeorm/zng-naming.strategy';
import { EntitySchema, MixedList } from 'typeorm';

export interface DatabaseConfigOptions {
  configService: ConfigService;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  entities?: MixedList<Function | string | EntitySchema>;
  schema?: string;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  migrations?: MixedList<Function | string>;
}

// Common Configuration settings across Services
export function DbConfiguration(options: DatabaseConfigOptions): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: options.configService.get<string>('DB_HOST'),
    port: parseInt(options.configService.get<string>('DB_PORT')),
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
