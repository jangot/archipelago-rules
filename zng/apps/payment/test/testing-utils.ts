/**
 * Type for mocked objects
 */
export type MockType<T> = {
  [P in keyof T]: jest.Mock<unknown>;
};

/**
 * Mock factory for repositories
 */
export const mockRepositoryFactory = jest.fn(() => ({
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
}));

/**
 * Mock factory for TypeORM repositories
 */
export const mockTypeOrmRepositoryFactory = jest.fn(() => ({
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  restore: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    execute: jest.fn(),
  })),
}));

/**
 * Mock factory for services
 */
export const mockServiceFactory = (methods: string[]) => {
  const mockService = {};
  methods.forEach(method => {
    mockService[method] = jest.fn();
  });
  return mockService;
};

