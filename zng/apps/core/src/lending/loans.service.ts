import { LoanCreateRequestDto, LoanResponseDto } from '@core/dto';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { LoanCreateCommand, LoanProposeCommand } from './commands';
import { MapToDto } from '@library/entity/mapping/maptodto.decorator';
import { LoanBindIntent } from '@library/entity/enum';

@Injectable()
export class LoansService {
  private readonly logger: Logger = new Logger(LoansService.name);
    
  constructor(private readonly commandBus: CommandBus) {}
    
  @MapToDto(LoanResponseDto)
  public async createLoan(userId: string, input: LoanCreateRequestDto): Promise<LoanResponseDto | null> {
    const result = await this.commandBus.execute(new LoanCreateCommand({ ...input, userId, loanId: null }));
    return result as unknown as LoanResponseDto | null;
  }

  @MapToDto(LoanResponseDto)
  public async proposeLoan(userId: string, loanId: string,  sourcePaymentAccountId: string): Promise<LoanResponseDto | null> {
    const result = await this.commandBus.execute(new LoanProposeCommand({ userId, loanId, sourcePaymentAccountId }));
    return result as unknown as LoanResponseDto | null;
  }

  public async bindLoansToContact(contactUri: string, intent: LoanBindIntent, loanId?: string): Promise<Array<LoanResponseDto> | null> {
    return null;
  }
}
