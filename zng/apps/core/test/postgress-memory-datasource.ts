import { ZngNamingStrategy } from "@library/extensions/typeorm";
import { DataSource } from "typeorm";
import { CoreEntities } from "../src/data/entity";
import { newDb } from "pg-mem";
import { v4 } from "uuid";

// Initiate newDb - in-memory PG database and create connection for TypeORM
export const memoryDataSource = async (): Promise<DataSource> => {
    const memoryDatabase = newDb();
    const memoryDbConnection: DataSource = await memoryDatabase.adapters.createTypeormDataSource({
        type: 'postgres',
        entities: [...CoreEntities],
        schema: 'core',
        namingStrategy: new ZngNamingStrategy(),
    });

    // Workaround for current_database function. It is missing in pg-mem implementation
    memoryDatabase.public.registerFunction({
        implementation: () => 'test',
        name: 'current_database',
    });

    // Workaround for version function. It is missing in pg-mem implementation
    memoryDatabase.public.registerFunction({
        implementation: () => '1',
        name: 'version',
    });

    // Workaround for uuid_generate_v4 function. It is missing in pg-mem implementation
    memoryDatabase.public.registerFunction({
        implementation: () => v4(),
        name: 'uuid_generate_v4',
    });

    memoryDatabase.createSchema('core');

    await memoryDbConnection.initialize();
    await memoryDbConnection.synchronize();

    return memoryDbConnection;
};