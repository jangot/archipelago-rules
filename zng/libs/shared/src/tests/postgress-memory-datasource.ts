import { DataType, IMemoryDb, ISchema, newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { v4 } from 'uuid';

import { ZngNamingStrategy } from '@library/extensions/typeorm';

import { DatabaseConfigEntities, DbSchemaCodes } from '@library/shared/common/data';

/**
 * Creates a single in-memory database connection with all schemas for testing.
 * This matches the production single DataSource approach.
 * 
 * @param allEntities - All entity classes from all schemas
 * @returns Promise resolving to DataSource and database instance
 */
export const memoryDataSourceSingle = async (allEntities: DatabaseConfigEntities): Promise<{ dataSource: DataSource; database: IMemoryDb }> => {
  const database = newDb();
  const dataSource: DataSource = await database.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: allEntities,
    namingStrategy: new ZngNamingStrategy(),
  });

  registerMemoryDatabaseFunctions(database.public);

  // Create all schemas and register functions for each
  const coreSchema = database.createSchema(DbSchemaCodes.Core);
  registerMemoryDatabaseFunctions(coreSchema);
  const paymentSchema = database.createSchema(DbSchemaCodes.Payment);
  registerMemoryDatabaseFunctions(paymentSchema);
  const notificationSchema = database.createSchema(DbSchemaCodes.Notification);
  registerMemoryDatabaseFunctions(notificationSchema);

  await dataSource.initialize();
  await dataSource.synchronize();

  return { dataSource, database };
};

/**
 * Creates a simple single in-memory database connection for testing.
 * This is a simplified version that just takes entities without schema configuration.
 * 
 * @param allEntities - All entity classes from all schemas
 * @returns Promise resolving to DataSource
 */
export const memoryDataSourceSimple = async (allEntities: DatabaseConfigEntities): Promise<DataSource> => {
  const memoryDatabase = newDb();
  const dataSource: DataSource = await memoryDatabase.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: allEntities,
    namingStrategy: new ZngNamingStrategy(),
  });

  registerMemoryDatabaseFunctions(memoryDatabase.public);

  // Create all schemas
  memoryDatabase.createSchema(DbSchemaCodes.Core);
  memoryDatabase.createSchema(DbSchemaCodes.Payment);
  memoryDatabase.createSchema(DbSchemaCodes.Notification);

  await dataSource.initialize();
  await dataSource.synchronize();

  return dataSource;
};

// Workaround for missing functions in pg-mem implementation
function registerMemoryDatabaseFunctions(schema: ISchema) {
  schema.registerFunction({ implementation: () => 'test', name: 'current_database' });

  schema.registerFunction({ implementation: () => '1', name: 'version' });

  schema.registerFunction({ implementation: v4, name: 'uuid_generate_v4', returns: DataType.uuid, impure: true });
}
