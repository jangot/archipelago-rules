import { LoanCreateRequestDto, LoanResponseDto } from '@core/dto';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { LoanCreateCommand } from './commands';
import { MapToDto } from '@library/entity/mapping/maptodto.decorator';

@Injectable()
export class LoansService {
  private readonly logger: Logger = new Logger(LoansService.name);
    
  constructor(private readonly commandBus: CommandBus) {}
    
  @MapToDto(LoanResponseDto)
  public async createLoan(userId: string, input: LoanCreateRequestDto): Promise<LoanResponseDto | null> {
    const result = await this.commandBus.execute(new LoanCreateCommand({ ...input, userId, loanId: null }));
    return result as unknown as LoanResponseDto | null;
  }
}
