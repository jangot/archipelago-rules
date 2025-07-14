import { JwtAuthGuard } from '@core/modules/auth/guards';
import { PaymentMethodCreateRequestDto } from '@core/modules/banking/dto/request/payment-method.create.request.dto';
import { PaymentAccountResponseDto } from '@core/modules/banking/dto/response/payment-account.response.dto';
import { IRequest } from '@library/shared/type';
import { Body, Controller, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BankingService } from './banking.service';

@Controller('bank')
@ApiTags('bank')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
export class BankingController {
  private readonly logger: Logger = new Logger(BankingController.name);

  constructor(private readonly bankingService: BankingService) {}

  @Post('account')
  @ApiOperation({ summary: 'Add a payment method', description: 'Add a payment method' })
  @ApiCreatedResponse({ description: 'Payment method added successfully', type: PaymentAccountResponseDto })
  public async addPaymentMethod(@Req() request: IRequest, @Body() input: PaymentMethodCreateRequestDto): Promise<PaymentAccountResponseDto | null> {
    const userId = request.user!.id;

    this.logger.debug('Adding payment method', { input });
    return this.bankingService.addPaymentAccount(userId, input);
  }
}
