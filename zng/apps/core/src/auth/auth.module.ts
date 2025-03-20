import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CustomAuthStrategies } from './strategies';
import { CustomAuthGuards } from './guards';
import { UsersModule } from '../users';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataModule } from '../data';
import { JwtModule } from '@nestjs/jwt';
import { RegistrationService } from './registration.service';
import { CqrsModule } from '@nestjs/cqrs';
import { RegistrationCommandHandlers } from './registration/commands';
import { DomainModule } from '../domain/domain.module';
import { LoginCommandHandlers } from './login/commands';

@Module({
  imports: [
    CqrsModule,
    UsersModule,
    ConfigModule,
    DataModule,
    DomainModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: configService.getOrThrow<number>('JWT_ACCESS_EXP') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    Logger,
    AuthService,
    RegistrationService,
    ...CustomAuthStrategies,
    ...CustomAuthGuards,
    ...RegistrationCommandHandlers,
    ...LoginCommandHandlers,
  ],
})
export class AuthModule {}
