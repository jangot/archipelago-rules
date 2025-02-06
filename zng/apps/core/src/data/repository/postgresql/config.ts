import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { ApplicationUser, Loan } from "../../entity";

export function configuration(configService: ConfigService): TypeOrmModuleOptions {
return {
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        synchronize: configService.get<string>('NODE_ENV') === 'development', // Don't synchronize in Prod!!!        
        namingStrategy : new SnakeNamingStrategy(),
        autoLoadEntities: true,
        logging: configService.get<string>('TYPE_ORM_LOGGING') === 'true' ? ["query", "error"] : false,
        entities:[Loan, ApplicationUser]
        //migrations: ['**/migrations/*-migration{.ts,.js}'],
        //entities: ['**/*.entity.ts']
  }
}
