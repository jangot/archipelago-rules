import { Module } from '@nestjs/common';
import { IDomainServices } from './idomain.services';
import { DomainServices } from './domain.services';
import { DataModule } from '../data';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { UserDomainService } from './services/user.domain.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    CqrsModule,
    ConfigModule,
    DataModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: configService.getOrThrow<number>('JWT_ACCESS_EXP') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UserDomainService, { provide: IDomainServices, useClass: DomainServices }],
  exports: [IDomainServices],
})
export class DomainModule {}
