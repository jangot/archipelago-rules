import { IRepositoryBase } from '../interfaces/ibase.repository';
import { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';

export class RepositoryBase<Entity extends ObjectLiteral> implements IRepositoryBase<Entity> {
  constructor(protected readonly repository: Repository<Entity>) {}

  public async getAll(): Promise<Entity[]> {
    return await this.repository.find();
  }

  public async get<T extends keyof Entity>(id: Entity[T]): Promise<Entity | null> {
    return await this.repository.findOneBy({ id } as FindOptionsWhere<Entity>);
  }

  public async create(item: Entity): Promise<Entity> {
    return await this.repository.save(item);
  }

  public async update(id: string, item: Entity): Promise<boolean> {
    const updateResult = await this.repository.update(id, item);

    return (updateResult.affected || 0) > 0;
  }
}
