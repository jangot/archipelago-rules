import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DeepPartial } from 'typeorm';
import { RepositoryBase } from '@library/shared/common/data/base.repository';
import { LoanApplication } from '@library/shared/domain/entity';
import { DtoMapper } from '@library/entity/mapping/dto.mapper';
import { LoanApplicationResponseDto } from '@core/modules/lending/dto/response';

@Injectable()
export class LoanApplicationService {
  constructor(
    @Inject('LoanApplicationBaseRepository')
    private readonly repository: RepositoryBase<LoanApplication>
  ) {}

  async getById(id: string): Promise<LoanApplicationResponseDto | null> {
    const result = await this.repository.getById(id);
    if (!result) throw new NotFoundException(`LoanApplication with ID ${id} not found`);
    return DtoMapper.toDto(result, LoanApplicationResponseDto);
  }

  async create(data: DeepPartial<LoanApplication>): Promise<LoanApplicationResponseDto | null> {
    return DtoMapper.toDto(this.repository.insertWithResult(data), LoanApplicationResponseDto);
  }

  async partiallyUpdate(id: string, data: DeepPartial<LoanApplication>): Promise<boolean> {
    return this.repository.update(id, data);
  }
}
