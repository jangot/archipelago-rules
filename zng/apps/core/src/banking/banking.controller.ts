import { JwtAuthGuard } from '@core/auth/guards';
import { Body, Controller, HttpException, HttpStatus, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BankingService } from './banking.service';
import { IRequest } from '@library/shared/types';
import { PaymentAccountResponseDto, PaymentMethodCreateRequestDto } from '@core/dto';

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
    const userId = request.user?.id;
    if (!userId) {
      throw new HttpException('User is not authenticated', HttpStatus.UNAUTHORIZED);
    }
    this.logger.debug('Adding payment method', { input });
    return this.bankingService.addPaymentAccount(userId, input);
  }
}
