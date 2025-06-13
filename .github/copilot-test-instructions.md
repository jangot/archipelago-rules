# ZNG Testing Guidelines for GitHub Copilot

You are a senior TypeScript test engineer with expertise in the NestJS framework and a preference for comprehensive, maintainable test suites. Generate tests that comply with these guidelines when working with the ZNG project.

## Testing Overview

ZNG tests are written in TypeScript using Jest as the testing framework. The project includes three main types of tests:
- Unit tests for testing isolated components
- Integration tests for testing interactions between components
- End-to-end (E2E) tests for testing complete API flows

---

## Basic Testing Principles

- Use English for all test code and documentation.
- Always declare the type of each variable and function (parameters and return value).
- Avoid using `any` type; create necessary types instead.
- Use descriptive test names that clearly indicate what is being tested.
- Follow the Arrange-Act-Assert (AAA) pattern in test structure.
- Use JSDoc to document test suites and complex test cases.
- Follow a consistent naming convention for test files: `*.spec.ts` for unit/integration tests, `*.e2e-spec.ts` for E2E tests.

---

## Common Testing Patterns

### Test Structure

- Each test file should start with necessary imports.
- Use `describe` blocks to group related tests.
- Use nested `describe` blocks for logical grouping of test cases.
- Use `it` or `test` functions for individual test cases.
- Use clear and descriptive test names that follow the pattern: "should [expected behavior] when [condition]".

### Test Isolation

- Each test should be independent and not rely on the state of other tests.
- Use `beforeEach` to set up the test environment and `afterEach` to clean up.
- Use `beforeAll` and `afterAll` for setup/teardown operations that can be shared across multiple tests.

### Mocking

- Use Jest's mocking capabilities to isolate the component under test.
- For TypeScript, use `jest.mock()` with the `__mocks__` pattern where appropriate.
- Use `jest.spyOn()` for monitoring function calls and controlling their behavior.
- Always restore mocks after tests using `jest.restoreAllMocks()` or `mockFn.mockRestore()`.

---

## Unit Testing

Unit tests focus on testing individual components in isolation, typically at the service or utility level.

### Principles

- Test each function or method in isolation.
- Mock all dependencies and external services.
- Focus on testing business logic, not implementation details.
- Cover edge cases and error conditions.

### Service Testing

- Test each public method of the service.
- Mock all injected dependencies.
- Verify that service methods correctly interact with their dependencies.
- Test error handling and edge cases.

```typescript
describe('UserService', () => {
  let userService: UserService;
  let userRepositoryMock: MockType<IUserRepository>;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: IUserRepository,
          useFactory: mockRepositoryFactory
        }
      ]
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepositoryMock = module.get(IUserRepository);
  });

  it('should get a user by ID', async () => {
    // Arrange
    const userId = '123';
    const expectedUser: IApplicationUser = {
      id: userId,
      email: 'test@example.com',
      // ...other user properties
    };
    userRepositoryMock.findOneBy.mockReturnValue(Promise.resolve(expectedUser));
    
    // Act
    const result = await userService.getUserById(userId);
    
    // Assert
    expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: userId });
    expect(result).toEqual(expectedUser);
  });

  it('should return null when user not found', async () => {
    // Arrange
    const userId = 'nonexistent';
    userRepositoryMock.findOneBy.mockReturnValue(Promise.resolve(null));
    
    // Act
    const result = await userService.getUserById(userId);
    
    // Assert
    expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ id: userId });
    expect(result).toBeNull();
  });
});
```

### Repository Testing

- Test custom repository methods (those not provided by RepositoryBase).
- Mock the TypeORM repository.
- Verify that repository methods correctly transform data and handle errors.

```typescript
describe('UserRepository', () => {
  let userRepository: UserRepository;
  let typeOrmRepositoryMock: MockType<Repository<User>>;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getRepositoryToken(User),
          useFactory: mockTypeOrmRepositoryFactory
        }
      ]
    }).compile();

    userRepository = module.get<UserRepository>(UserRepository);
    typeOrmRepositoryMock = module.get(getRepositoryToken(User));
  });

  it('should find active users', async () => {
    // Arrange
    const expectedUsers = [{ id: '1', isActive: true }, { id: '2', isActive: true }];
    typeOrmRepositoryMock.find.mockReturnValue(Promise.resolve(expectedUsers));
    
    // Act
    const result = await userRepository.findActiveUsers();
    
    // Assert
    expect(typeOrmRepositoryMock.find).toHaveBeenCalledWith({ where: { isActive: true } });
    expect(result).toEqual(expectedUsers);
  });
});
```

### Utility Function Testing

- Test edge cases and common use cases.
- Verify input validation and error handling.
- For pure functions, focus on input/output relationships.

```typescript
describe('DateUtils', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      // Arrange
      const date = new Date('2023-01-01T12:00:00Z');
      
      // Act
      const result = DateUtils.formatDate(date, 'YYYY-MM-DD');
      
      // Assert
      expect(result).toBe('2023-01-01');
    });
    
    it('should handle invalid date', () => {
      // Act & Assert
      expect(() => DateUtils.formatDate(null, 'YYYY-MM-DD')).toThrow();
    });
  });
});
```

---

## Integration Testing

Integration tests verify that different components work together correctly.

### Principles

- Test the interaction between multiple components.
- Mock external dependencies (databases, APIs) when necessary.
- Focus on testing complete use cases and workflows.
- Verify that components integrate correctly.

### Service Integration Testing

- Test interactions between multiple services.
- Mock external dependencies but use real implementations of internal services.
- Verify that data flows correctly between services.

```typescript
describe('Authentication Flow', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let userRepositoryMock: MockType<IUserRepository>;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UserService,
        JwtService,
        {
          provide: IUserRepository,
          useFactory: mockRepositoryFactory
        }
      ]
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    userRepositoryMock = module.get(IUserRepository);
  });

  it('should authenticate user and return JWT token', async () => {
    // Arrange
    const loginRequest = { email: 'user@example.com', password: 'password123' };
    const user: IApplicationUser = {
      id: '123',
      email: loginRequest.email,
      passwordHash: 'hashed_password',
      // ...other properties
    };
    const expectedToken = 'jwt_token';
    
    userRepositoryMock.findOneBy.mockReturnValue(Promise.resolve(user));
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
    jest.spyOn(jwtService, 'sign').mockReturnValue(expectedToken);
    
    // Act
    const result = await authService.validateUserAndGenerateToken(loginRequest);
    
    // Assert
    expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ email: loginRequest.email });
    expect(bcrypt.compare).toHaveBeenCalledWith(loginRequest.password, user.passwordHash);
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email });
    expect(result).toEqual({ 
      accessToken: expectedToken,
      user: expect.objectContaining({ id: user.id, email: user.email })
    });
  });
});
```

### Repository Integration Testing

- Test repositories with a test database or in-memory database.
- Focus on testing complex queries and transactions.
- Verify that database operations work correctly.

```typescript
describe('LoanRepository Integration', () => {
  let app: INestApplication;
  let connection: Connection;
  let loanRepository: LoanRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Loan, User, Payment],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([Loan, User, Payment]),
      ],
      providers: [LoanRepository],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    connection = moduleFixture.get<Connection>(Connection);
    loanRepository = moduleFixture.get<LoanRepository>(LoanRepository);
    
    // Seed test data
    await connection.query(`INSERT INTO users (id, email) VALUES ('1', 'lender@example.com')`);
    await connection.query(`INSERT INTO users (id, email) VALUES ('2', 'borrower@example.com')`);
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  it('should find loans by borrower ID with related payments', async () => {
    // Arrange
    const borrowerId = '2';
    await connection.query(`
      INSERT INTO loans (id, amount, lending_user_id, borrowing_user_id, status)
      VALUES ('loan1', 1000, '1', '2', 'active')
    `);
    await connection.query(`
      INSERT INTO payments (id, amount, loan_id, status)
      VALUES ('payment1', 100, 'loan1', 'completed')
    `);
    
    // Act
    const result = await loanRepository.findLoansByBorrowerWithPayments(borrowerId);
    
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('loan1');
    expect(result[0].borrowingUserId).toBe(borrowerId);
    expect(result[0].payments).toHaveLength(1);
    expect(result[0].payments[0].id).toBe('payment1');
  });
});
```

---

## End-to-End (E2E) Testing

E2E tests verify that the entire application works correctly from the user's perspective.

### Principles

- Test complete user flows through the API.
- Use a test database or in-memory database.
- Focus on testing endpoints and their responses.
- Verify that authentication, validation, and business logic work correctly together.

### Controller E2E Testing

- Test API endpoints with real HTTP requests.
- Verify request validation, authentication, and authorization.
- Test success and error responses.

```typescript
describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Connection)
      .useFactory({
        factory: () => {
          return createTestingConnection([User]);
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    
    connection = moduleFixture.get<Connection>(Connection);
    
    // Seed test user
    const passwordHash = await bcrypt.hash('Password123', 10);
    await connection.query(`
      INSERT INTO users (id, email, password_hash, is_active)
      VALUES ('test-user-id', 'test@example.com', '${passwordHash}', true)
    `);
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  it('/auth/login (POST) - should return JWT token for valid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body.accessToken).toBeDefined();
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe('test@example.com');
      });
  });

  it('/auth/login (POST) - should return 401 for invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'WrongPassword',
      })
      .expect(401);
  });

  it('/auth/login (POST) - should return 400 for invalid request body', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'invalid-email',
        password: '',
      })
      .expect(400)
      .expect((response) => {
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBeInstanceOf(Array);
      });
  });
});
```

### Complex Flow E2E Testing

- Test multi-step user flows.
- Verify that state is correctly maintained between requests.
- Test that business rules are enforced correctly.

```typescript
describe('Loan Application Flow (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let lenderToken: string;
  let borrowerToken: string;
  let loanId: string;

  beforeAll(async () => {
    // Setup test app with database
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    
    connection = moduleFixture.get<Connection>(Connection);
    
    // Seed test users
    const passwordHash = await bcrypt.hash('Password123', 10);
    await connection.query(`
      INSERT INTO users (id, email, password_hash, is_active, role)
      VALUES ('lender-id', 'lender@example.com', '${passwordHash}', true, 'lender')
    `);
    await connection.query(`
      INSERT INTO users (id, email, password_hash, is_active, role)
      VALUES ('borrower-id', 'borrower@example.com', '${passwordHash}', true, 'borrower')
    `);
    
    // Get auth tokens
    const lenderResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'lender@example.com',
        password: 'Password123',
      });
    lenderToken = lenderResponse.body.accessToken;
    
    const borrowerResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'borrower@example.com',
        password: 'Password123',
      });
    borrowerToken = borrowerResponse.body.accessToken;
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  it('Step 1: Borrower creates loan request', async () => {
    const response = await request(app.getHttpServer())
      .post('/loans/request')
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({
        amount: 1000,
        purpose: 'Home repair',
        termMonths: 12,
      })
      .expect(201);
    
    loanId = response.body.id;
    expect(response.body.status).toBe('pending');
    expect(response.body.borrowingUserId).toBe('borrower-id');
    expect(response.body.amount).toBe(1000);
  });

  it('Step 2: Lender approves loan request', async () => {
    await request(app.getHttpServer())
      .patch(`/loans/${loanId}/approve`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(200);
    
    const loanResponse = await request(app.getHttpServer())
      .get(`/loans/${loanId}`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(200);
    
    expect(loanResponse.body.status).toBe('approved');
    expect(loanResponse.body.lendingUserId).toBe('lender-id');
  });

  it('Step 3: Lender funds the loan', async () => {
    await request(app.getHttpServer())
      .post(`/loans/${loanId}/fund`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .send({
        paymentMethodId: 'test-payment-method',
      })
      .expect(200);
    
    const loanResponse = await request(app.getHttpServer())
      .get(`/loans/${loanId}`)
      .set('Authorization', `Bearer ${borrowerToken}`)
      .expect(200);
    
    expect(loanResponse.body.status).toBe('funded');
    expect(loanResponse.body.fundedDate).toBeDefined();
  });

  it('Step 4: Borrower makes a payment', async () => {
    const paymentResponse = await request(app.getHttpServer())
      .post(`/loans/${loanId}/payments`)
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({
        amount: 100,
        paymentMethodId: 'test-payment-method',
      })
      .expect(201);
    
    expect(paymentResponse.body.status).toBe('pending');
    expect(paymentResponse.body.amount).toBe(100);
    
    // Payment processing would normally happen asynchronously
    // Here we're simulating it completing successfully
    await connection.query(`
      UPDATE payments
      SET status = 'completed', processed_date = CURRENT_TIMESTAMP
      WHERE id = '${paymentResponse.body.id}'
    `);
    
    const loanResponse = await request(app.getHttpServer())
      .get(`/loans/${loanId}`)
      .set('Authorization', `Bearer ${borrowerToken}`)
      .expect(200);
    
    expect(loanResponse.body.remainingBalance).toBe(900);
    expect(loanResponse.body.payments).toHaveLength(1);
    expect(loanResponse.body.payments[0].status).toBe('completed');
  });
});
```

---

## Test Helpers and Utilities

### Mock Factories

Create utility functions to generate mocks for common dependencies.

```typescript
// Mock factory for repositories
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
  // Add any custom methods from your repositories
}));

// Mock factory for services
export const mockServiceFactory = (methods: string[]) => {
  const mockService = {};
  methods.forEach(method => {
    mockService[method] = jest.fn();
  });
  return mockService;
};

// Type for mocked objects
export type MockType<T> = {
  [P in keyof T]: jest.Mock<unknown>;
};
```

### Test Data Factories

Create utility functions to generate test data for common entities.

```typescript
// User test data factory
export const createTestUser = (overrides: Partial<IApplicationUser> = {}): IApplicationUser => ({
  id: 'test-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  passwordHash: 'hashed_password',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Loan test data factory
export const createTestLoan = (overrides: Partial<ILoan> = {}): ILoan => ({
  id: 'loan-test-id',
  amount: 1000,
  status: 'pending',
  lendingUserId: 'lender-id',
  borrowingUserId: 'borrower-id',
  termMonths: 12,
  interestRate: 5.0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
```

### In-Memory Database Setup

Set up an in-memory database for testing to avoid relying on external databases.

```typescript
// Create a testing database connection
export const createTestingConnection = async (entities: any[]) => {
  return await createConnection({
    type: 'sqlite',
    database: ':memory:',
    entities,
    dropSchema: true,
    synchronize: true,
    logging: false,
  });
};
```

---

## Best Practices

### Test Coverage

- Aim for high test coverage, particularly for critical business logic.
- Use Jest's coverage reports to identify areas that need more testing.
- Focus on quality over quantity—ensure tests are meaningful and cover edge cases.

### Performance

- Keep tests fast by using mocks and in-memory databases.
- Use `beforeAll` and `afterAll` hooks for expensive setup/teardown operations.
- Avoid unnecessary database operations in tests.

### Maintainability

- Keep test code as clean and maintainable as production code.
- Use helper functions and utilities to reduce duplication.
- Follow the same coding standards and patterns as the rest of the codebase.

### Test Organization

- Group tests logically by feature or component.
- Use descriptive test names that clearly indicate what is being tested.
- Include both positive and negative test cases.

---

## Test File Naming and Location

- Place unit and integration tests alongside the code they test with the `.spec.ts` suffix.
- Place E2E tests in a separate `test` directory with the `.e2e-spec.ts` suffix.
- Follow the same directory structure as the source code.

Example:
- Service unit test: `src/users/user.service.spec.ts`
- Controller E2E test: `test/users/users.e2e-spec.ts`

---

## Common Testing Scenarios

### Testing JWT Authentication

```typescript
describe('JWT Authentication Guard', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow access with valid JWT token', async () => {
    // Generate a valid token
    const token = jwtService.sign({ sub: 'user-id', email: 'test@example.com' });
    
    return request(app.getHttpServer())
      .get('/protected-endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('should deny access with invalid JWT token', async () => {
    return request(app.getHttpServer())
      .get('/protected-endpoint')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('should deny access with missing JWT token', async () => {
    return request(app.getHttpServer())
      .get('/protected-endpoint')
      .expect(401);
  });
});
```

### Testing Validation Pipes

```typescript
describe('Validation Pipe', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject invalid request data', async () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'not-an-email',
        password: '123', // Too short
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.message).toContain('email must be an email');
        expect(response.body.message).toContain('password is too short');
      });
  });

  it('should accept valid request data', async () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        email: 'valid@example.com',
        password: 'Password123',
      })
      .expect(201);
  });
});
```

### Testing Transaction Rollbacks

```typescript
describe('Loan Creation Transaction', () => {
  let app: INestApplication;
  let connection: Connection;
  let loanService: LoanService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Loan, User, LoanTerms],
          synchronize: true,
        }),
        LoanModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    connection = moduleFixture.get<Connection>(Connection);
    loanService = moduleFixture.get<LoanService>(LoanService);
    
    // Seed test data
    await connection.query(`
      INSERT INTO users (id, email) 
      VALUES ('lender-id', 'lender@example.com'), ('borrower-id', 'borrower@example.com')
    `);
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  it('should rollback entire transaction if loan terms cannot be created', async () => {
    // Arrange
    const createLoanDto = {
      amount: 1000,
      borrowingUserId: 'borrower-id',
      lendingUserId: 'lender-id',
      termMonths: 12,
      interestRate: 5,
    };
    
    // Force loan terms creation to fail
    jest.spyOn(LoanTerms.prototype, 'save').mockImplementation(() => {
      throw new Error('Failed to save loan terms');
    });
    
    // Act & Assert
    await expect(loanService.createLoan(createLoanDto)).rejects.toThrow();
    
    // Verify no loan was created despite the transaction failure
    const loans = await connection.query('SELECT * FROM loans');
    expect(loans).toHaveLength(0);
    
    // Restore the mock
    jest.restoreAllMocks();
  });
});
```

---

## Test Documentation

Document your tests using JSDoc comments for complex test suites and scenarios.

```typescript
/**
 * Tests the loan application workflow from creation to approval and funding.
 * 
 * The workflow consists of these steps:
 * 1. Borrower creates a loan request
 * 2. Lender approves the loan request
 * 3. Lender funds the approved loan
 * 4. Borrower makes payments on the funded loan
 * 
 * Each step is verified to ensure that the loan status transitions correctly
 * and that each user can only perform actions appropriate to their role.
 */
describe('Loan Application Workflow', () => {
  // Test code...
});
```

---

## Copilot Comments Usage

To guide GitHub Copilot effectively when writing tests, include inline comments referencing these guidelines. For example:

- `// Test each service method in isolation with appropriate mocks`
- `// Follow AAA (Arrange-Act-Assert) pattern for test structure`
- `// Test both success and failure scenarios for this endpoint`
- `// Mock external dependencies but use real implementations for internal services`
- `// Use the test database connection from the test helpers module`
- `// Verify transaction rollback behavior by forcing a failure`
