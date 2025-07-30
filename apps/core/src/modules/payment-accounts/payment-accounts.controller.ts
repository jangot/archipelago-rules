import { JwtAuthGuard } from '@core/modules/auth/guards';
import { BankAccountResponseDto, DebitCardResponseDto, PaymentAccountResponseDto } from '@core/modules/payment-accounts/dto/response/payment-account.response.dto';
import { IRequest } from '@library/shared/type';
import { Body, Controller, Get, Logger, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiExtraModels, ApiOperation, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { DebitCardCreateRequestDto, IavAccountCreateRequestDto, MicrodepositsAccountCreateRequestDto, MicrodepositsValuesRequestDto, PaymentMethodCreateRequestDto, PaymentMethodProceedVerificationRequestDto, PaymentMethodVerifyRequestDto } from './dto/request';
import { BankingService } from './payment-accounts.service';

@Controller('payment-accounts')
@ApiTags('payment-accounts')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
export class BankingController {
  private readonly logger: Logger = new Logger(BankingController.name);

  constructor(private readonly bankingService: BankingService) {}

  @Post()
  @ApiOperation({ summary: 'Add a payment method', description: 'Add a payment method' })
  @ApiCreatedResponse({ 
    description: 'Payment method added successfully', 
    schema: {
      oneOf: [
        { $ref: getSchemaPath(DebitCardResponseDto) },
        { $ref: getSchemaPath(BankAccountResponseDto) },
        { type: 'null' },
      ],
    },
  })
  @ApiExtraModels(
    DebitCardCreateRequestDto, 
    MicrodepositsAccountCreateRequestDto, 
    IavAccountCreateRequestDto, 
    DebitCardResponseDto, 
    BankAccountResponseDto
  )
  @ApiBody({
    description: 'Payment method details to be added',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(DebitCardCreateRequestDto) },
        { $ref: getSchemaPath(MicrodepositsAccountCreateRequestDto) },
        { $ref: getSchemaPath(IavAccountCreateRequestDto) },
      ],
    },
  })
  public async addPaymentMethod(@Req() request: IRequest, @Body() input: PaymentMethodCreateRequestDto): Promise<PaymentAccountResponseDto | null> {
    const userId = request.user!.id;

    this.logger.debug('Adding payment method', { input });
    return this.bankingService.addPaymentAccount(userId, input);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify a payment account', description: 'Initiate verification process for a payment account' })
  @ApiCreatedResponse({ 
    description: 'Payment account verification initiated successfully', 
    schema: {
      oneOf: [
        { $ref: getSchemaPath(DebitCardResponseDto) },
        { $ref: getSchemaPath(BankAccountResponseDto) },
        { type: 'null' },
      ],
    },
  })
  @ApiExtraModels(PaymentMethodVerifyRequestDto, DebitCardResponseDto, BankAccountResponseDto)
  @ApiBody({
    description: 'Payment account verification details',
    schema: { $ref: getSchemaPath(PaymentMethodVerifyRequestDto) },
  })
  public async verifyPaymentAccount(
    @Req() request: IRequest,
    @Body() input: PaymentMethodVerifyRequestDto
  ): Promise<PaymentAccountResponseDto | null> {
    const userId = request.user!.id;

    this.logger.debug('Verifying payment account', { userId });
    // Implementation for verifying payment account goes here
    return this.bankingService.verifyPaymentAccount(userId, input);
  }

  @Patch('verify')
  @ApiOperation({ summary: 'Proceed with account verification', description: 'Proceed with microdeposits verification for a bank account' })
  @ApiCreatedResponse({ 
    description: 'Account verification completed successfully', 
    schema: {
      oneOf: [
        { $ref: getSchemaPath(DebitCardResponseDto) },
        { $ref: getSchemaPath(BankAccountResponseDto) },
        { type: 'null' },
      ],
    },
  })
  @ApiExtraModels(MicrodepositsValuesRequestDto, PaymentMethodProceedVerificationRequestDto, DebitCardResponseDto, BankAccountResponseDto)
  @ApiBody({
    description: 'Account verification details including microdeposit values',
    schema: { $ref: getSchemaPath(PaymentMethodProceedVerificationRequestDto) },
  })
  public async proceedAccountVerification(
    @Req() request: IRequest,
    @Body() input: PaymentMethodProceedVerificationRequestDto
  ): Promise<PaymentAccountResponseDto | null> {
    const userId = request.user!.id;

    this.logger.debug('Proceeding with account verification', { userId });
    // Implementation for proceeding with account verification goes here
    const { accountId, data: { firstValue, secondValue } } = input;
    return this.bankingService.microdepositsVerification(userId, accountId, firstValue, secondValue);

  }

  @Get('list')
  @ApiOperation({ summary: 'Get all payment accounts', description: 'Retrieve all payment accounts for the authenticated user' })
  @ApiCreatedResponse({ 
    description: 'Payment accounts retrieved successfully', 
    schema: {
      type: 'array',
      items: {
        oneOf: [
          { $ref: getSchemaPath(DebitCardResponseDto) },
          { $ref: getSchemaPath(BankAccountResponseDto) },
        ],
      },
    },
  })
  public async getAllPaymentAccounts(@Req() request: IRequest): Promise<PaymentAccountResponseDto[]> {
    const userId = request.user!.id;

    this.logger.debug('Fetching all payment accounts for user', { userId });
    return this.bankingService.listPaymentAccounts(userId);
  }

  @Get(':paymentAccountId')
  @ApiOperation({ summary: 'Get payment account by ID', description: 'Retrieve a specific payment account by its ID for the authenticated user' })
  @ApiCreatedResponse({ 
    description: 'Payment account retrieved successfully', 
    schema: {
      oneOf: [
        { $ref: getSchemaPath(DebitCardResponseDto) },
        { $ref: getSchemaPath(BankAccountResponseDto) },
        { type: 'null' },
      ],
    },
  })
  public async getPaymentAccountById(@Req() request: IRequest, @Param('paymentAccountId') paymentAccountId: string): Promise<PaymentAccountResponseDto | null> {
    const userId = request.user!.id;

    this.logger.debug('Fetching payment account by ID', { userId, paymentAccountId });
    return this.bankingService.getPaymentAccountById(userId, paymentAccountId);
  }
}
