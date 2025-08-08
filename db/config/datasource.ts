import { config as loadEnvironments } from 'dotenv';
import { DataSource } from 'typeorm';
import { ZngNamingStrategy } from '@library/extensions/typeorm/zng-naming.strategy';
import { AllEntities } from '@library/shared/domain/entity';

loadEnvironments();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '0'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: AllEntities,
  migrations: ['dist/migrations/*.js'],
  namingStrategy: new ZngNamingStrategy(),
  logging: process.env.TYPE_ORM_LOGGING === 'true' ? ['query', 'error'] : false,
});
