import { DomainModule } from '@core/modules/domain/domain.module';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BankingController } from './payment-accounts.controller';
import { BankingService } from './payment-accounts.service';

@Module({
  imports: [JwtModule, ConfigModule, DomainModule],
  controllers: [BankingController],
  providers: [Logger, BankingService],
})
export class PaymentAccountsModule {}
