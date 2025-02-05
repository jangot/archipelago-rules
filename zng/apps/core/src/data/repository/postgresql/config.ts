import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSource, DataSourceOptions } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { config } from "dotenv";
config();

const configService = new ConfigService();


export const configuration: TypeOrmModuleOptions = {
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        synchronize: configService.get<string>('NODE_ENV') === 'development', // Don't synchronize in Prod!!!
        autoLoadEntities: true,
        logging: configService.get<string>('TYPE_ORM_LOGGING') == 'true' ? ["query", "error"] : false,
        migrations: ['**/migrations/*-migration{.ts,.js}'],
        entities: ['**/*.entity.ts']
}

export const connectionSource = new DataSource(configuration as DataSourceOptions);