export interface IRepositoryBase<Entity> {
  getAll(): Promise<Entity[]>;
  get<T extends keyof Entity>(id: Entity[T]): Promise<Entity | null>;
  create(item: Entity): Promise<Entity>;
  update(id: string, item: Entity): Promise<boolean>;
}
