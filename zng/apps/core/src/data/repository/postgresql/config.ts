import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { CoreEntities } from "../../entity";
import { ZngNamingStrategy } from "libs/extensions/typeorm/zng-naming.strategy";

export function configuration(configService: ConfigService): TypeOrmModuleOptions {
return {
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        synchronize: configService.get<string>('NODE_ENV') === 'development', // Don't synchronize in Prod!!!
        // New Naming strategy that combines the SnakeNamingStrategy with custom code that does the following:
        // 1. Pluralizes the Table name if using the Entity Class name and not providing a specific name
        // 2. Generates the various constraint (pkey, fkey, key, unique, indexes, default, and exclusion) names that conform to Postgres naming conventions
        namingStrategy : new ZngNamingStrategy(),
        autoLoadEntities: true,
        logging: configService.get<string>('TYPE_ORM_LOGGING') === 'true' ? ["query", "error"] : false,
        entities:[...CoreEntities],
        schema: 'core' // Default schema to use for all entities defined here
        //migrations: ['**/migrations/*-migration{.ts,.js}'],
  }
}
