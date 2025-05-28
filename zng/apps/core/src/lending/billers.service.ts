import { IDomainServices } from '@core/domain/idomain.services';
import { BillerResponseDto } from '@core/dto';
import { ArrayOf, MapToDto, MapToDtoArray } from '@library/entity/mapping/maptodto.decorator';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BillersService {
  private readonly logger: Logger = new Logger(BillersService.name);

  constructor(private readonly domainServices: IDomainServices) {}

  @MapToDto(BillerResponseDto)
  public async createCustomBiller(creatorId: string, name: string): Promise<BillerResponseDto | null> {
    this.logger.debug(`createBiller: Creating custom Biller with name: ${name} by request from user: ${creatorId}`);
    const result = await this.domainServices.loanServices.createCustomBiller(creatorId, name);
    return result as unknown as BillerResponseDto | null;
  }

  @MapToDtoArray(ArrayOf(BillerResponseDto))
  public async getCustomBillers(creatorId: string): Promise<Array<BillerResponseDto> | null> {
    this.logger.debug(`getCustomBillers: Getting custom billers for user: ${creatorId}`);
    const result = await this.domainServices.loanServices.getCustomBillers(creatorId);
    return result as unknown as Array<BillerResponseDto> | null;
  }
}
