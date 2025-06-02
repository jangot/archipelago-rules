import { DataType, IMemoryDb, ISchema, newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { v4 } from 'uuid';

import { ZngNamingStrategy } from '@library/extensions/typeorm';

import { CoreEntities } from '../../../libs/shared/src/domain/entities';
import { DbSchemaCodes } from '@library/shared/common/data';

// Initiate newDb - in-memory PG database and create connection for TypeORM
export const memoryDataSource = async (): Promise<DataSource> => {
  const memoryDatabase = newDb();
  const memoryDbConnection: DataSource = await memoryDatabase.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: [...CoreEntities],
    schema: DbSchemaCodes.Core,
    namingStrategy: new ZngNamingStrategy(),
  });

  registerMemoryDatabaseFunctions(memoryDatabase.public);

  memoryDatabase.createSchema(DbSchemaCodes.Core);

  await memoryDbConnection.initialize();
  await memoryDbConnection.synchronize();

  return memoryDbConnection;
};

// Initiate newDb - in-memory PG database and create connection for TypeORM
export const memoryDataSourceForTests = async (): Promise<{ dataSource: DataSource; database: IMemoryDb }> => {
  const database = newDb();
  const dataSource: DataSource = await database.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: [...CoreEntities],
    schema: DbSchemaCodes.Core,
    namingStrategy: new ZngNamingStrategy(),
  });

  registerMemoryDatabaseFunctions(database.public);

  database.createSchema(DbSchemaCodes.Core);

  await dataSource.initialize();
  await dataSource.synchronize();

  return { dataSource, database };
};

// Workaround for missing functions in pg-mem implementation
function registerMemoryDatabaseFunctions(schema: ISchema) {
  schema.registerFunction({ implementation: () => 'test', name: 'current_database' });

  schema.registerFunction({ implementation: () => '1', name: 'version' });

  schema.registerFunction({ implementation: v4, name: 'uuid_generate_v4', returns: DataType.uuid, impure: true });
}
