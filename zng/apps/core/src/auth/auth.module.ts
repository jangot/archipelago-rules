import { Logger, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { CustomAuthStrategies } from './strategies';
import { CustomAuthGuards } from './guards';
import { UsersModule } from '../users';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataModule } from '../data';
import { JwtModule } from '@nestjs/jwt';
import { RegistrationFactory } from './registration.factory';
import { Registrators } from './registration';
import { RegistrationService } from './registration.service';
import { CqrsModule } from '@nestjs/cqrs';
import { CommandHandlers } from './registration/commands';

@Module({
  imports: [
    CqrsModule,
    UsersModule,
    ConfigModule,
    DataModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '120s' }, // TODO: move somewhere else to be dynamic?
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    Logger,
    AuthService,
    RegistrationService,
    RegistrationFactory,
    ...CustomAuthStrategies,
    ...CustomAuthGuards,
    ...Registrators,
    ...CommandHandlers,
  ],
})
export class AuthModule {}
