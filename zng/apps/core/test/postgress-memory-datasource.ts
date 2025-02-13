import { ZngNamingStrategy } from '@library/extensions/typeorm';
import { DataSource } from 'typeorm';
import { CoreEntities } from '../src/data/entity';
import { IMemoryDb, ISchema, newDb } from 'pg-mem';
import { v4 } from 'uuid';

// Initiate newDb - in-memory PG database and create connection for TypeORM
export const memoryDataSource = async (): Promise<DataSource> => {
  const memoryDatabase = newDb();
  const memoryDbConnection: DataSource = await memoryDatabase.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: [...CoreEntities],
    schema: 'core',
    namingStrategy: new ZngNamingStrategy(),
  });

  registerMemeoryBatabaseFunctions(memoryDatabase.public);

  memoryDatabase.createSchema('core');

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
    schema: 'core',
    namingStrategy: new ZngNamingStrategy(),
  });

  registerMemeoryBatabaseFunctions(database.public);

  database.createSchema('core');

  await dataSource.initialize();
  await dataSource.synchronize();

  return { dataSource, database };
};

// Workaround for missing functions in pg-mem implementation
function registerMemeoryBatabaseFunctions(schema: ISchema) {
  schema.registerFunction({
    implementation: () => 'test',
    name: 'current_database',
  });

  schema.registerFunction({
    implementation: () => '1',
    name: 'version',
  });

  schema.registerFunction({
    implementation: () => v4(),
    name: 'uuid_generate_v4',
  });
}
