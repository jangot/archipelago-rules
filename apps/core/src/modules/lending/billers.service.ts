import { IDomainServices } from '@core/modules/domain/idomain.services';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { Injectable, Logger } from '@nestjs/common';
import { BillerResponseDto } from './dto/response/biller.response.dto';

@Injectable()
export class BillersService {
  private readonly logger: Logger = new Logger(BillersService.name);

  constructor(private readonly domainServices: IDomainServices) {}

  public async createCustomBiller(creatorId: string, name: string): Promise<BillerResponseDto | null> {
    this.logger.debug(`createBiller: Creating custom Biller with name: ${name} by request from user: ${creatorId}`);
    const result = await this.domainServices.loanServices.createCustomBiller(creatorId, name);

    return DtoMapper.toDto(result, BillerResponseDto);
  }

  public async getCustomBillers(creatorId: string): Promise<Array<BillerResponseDto> | null> {
    this.logger.debug(`getCustomBillers: Getting custom billers for user: ${creatorId}`);
    const result = await this.domainServices.loanServices.getCustomBillers(creatorId);

    return DtoMapper.toDtoArray(result, BillerResponseDto);
  }
}
