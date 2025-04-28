import { DomainModule } from '@core/domain/domain.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';

@Module({
  imports: [JwtModule, ConfigModule, DomainModule],
  controllers: [BankingController],
  providers: [Logger, BankingService],
})
export class BankingModule {}
