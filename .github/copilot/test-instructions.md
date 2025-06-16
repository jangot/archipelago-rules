# ZNG Testing Guidelines for GitHub Copilot

You are a senior TypeScript test engineer with expertise in the NestJS framework and a preference for comprehensive, maintainable test suites. Generate tests that comply with these guidelines when working with the ZNG project.

## Testing Overview

ZNG tests are written in TypeScript using Jest as the testing framework. The project includes three main types of tests:
- Unit tests for testing isolated components
- Integration tests for testing interactions between components (preferring real service implementations where possible)
- End-to-end (E2E) tests for testing complete API flows (using real service implementations with minimal mocking)

ZNG highly encourages using real service implementations rather than mocks in integration and E2E tests wherever possible, especially within 2-3 levels of dependency injection. This approach ensures tests validate actual service interactions and behaviors while maintaining good test isolation.

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
- Prefer using real service implementations rather than mocks for up to 2-3 levels of injected dependencies.
- Only mock external dependencies (databases, APIs, third-party services) when necessary.
- Focus on testing complete use cases and workflows.
- Verify that components integrate correctly with their real dependencies.
- Ensure that the test environment is isolated and repeatable despite using real service implementations.

### Service Integration Testing

- Test interactions between multiple services using real service implementations wherever possible.
- For optimal integration testing, use real implementations of all internal services that are within 2-3 dependency levels.
- Only mock repositories, external APIs, infrastructure services, and cross-boundary dependencies.
- Verify that data flows correctly between real service implementations.
- Use the actual dependency injection container to resolve services rather than manually creating instances.

```typescript
// Example using mocked repository but real service implementations
describe('Authentication Flow with Real Services', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let userRepositoryMock: MockType<IUserRepository>;
  let emailService: EmailService;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [authConfig],
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('auth.jwtSecret'),
            signOptions: { expiresIn: '1h' },
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [
        // Real service implementations for up to 3 levels of dependency
        AuthService,
        UserService,
        EmailService,
        UserMapper,
        TokenService,
        // Mock only repositories and external services
        {
          provide: IUserRepository,
          useFactory: mockRepositoryFactory
        },
        {
          provide: IExternalNotificationService,
          useFactory: () => ({
            sendNotification: jest.fn().mockResolvedValue(true),
          }),
        },
      ]
    }).compile();

    // Get real service instances from the DI container
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    
    // Get mocked repositories
    userRepositoryMock = module.get(IUserRepository);
  });

  it('should authenticate user and return JWT token using real service implementations', async () => {
    // Arrange
    const loginRequest = { email: 'user@example.com', password: 'password123' };
    const user: IApplicationUser = {
      id: '123',
      email: loginRequest.email,
      passwordHash: await bcrypt.hash('password123', 10), // Use real bcrypt for better integration testing
      isActive: true,
      // ...other properties
    };
    
    userRepositoryMock.findOneBy.mockReturnValue(Promise.resolve(user));
    
    // Act
    const result = await authService.validateUserAndGenerateToken(loginRequest);
    
    // Assert
    expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ email: loginRequest.email });
    expect(result).toHaveProperty('accessToken');
    expect(result.accessToken).toBeDefined();
    expect(result.user).toHaveProperty('id', user.id);
    expect(result.user).toHaveProperty('email', user.email);
  });
  
  it('should use real EmailService implementation when sending password reset', async () => {
    // Arrange
    const email = 'user@example.com';
    const user: IApplicationUser = {
      id: '123',
      email: email,
      // ...other properties
    };
    const resetToken = 'reset-token-123';
    
    userRepositoryMock.findOneBy.mockReturnValue(Promise.resolve(user));
    jest.spyOn(TokenService.prototype, 'generateResetToken').mockReturnValue(resetToken);
    jest.spyOn(emailService, 'sendPasswordResetEmail');
    
    // Act
    await authService.initiatePasswordReset(email);
    
    // Assert
    expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({ email });
    // Verify that the real EmailService was called with correct parameters
    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email, id: user.id }),
      resetToken
    );
  });
});
```

### Repository Integration Testing

- Test repositories with a test database or in-memory database.
- Focus on testing complex queries and transactions.
- Verify that database operations work correctly.

### Real Service Implementation Approach

- Use a layered approach to mocking based on test type and dependency depth:
  - **Level 1**: Core business services - Use real implementations in both integration and E2E tests
  - **Level 2**: Supporting services - Use real implementations in integration and E2E tests
  - **Level 3**: Infrastructure services - Use real implementations in E2E tests, mock in integration tests
  - **External dependencies**: Always mock in integration tests, consider mocking in E2E tests

- In integration tests:
  - Create a dedicated test module with real service implementations for the service under test and its immediate dependencies
  - Only mock repositories, external APIs, and cross-boundary services
  - Configure the test module to use the actual NestJS dependency injection system

- In E2E tests:
  - Use the complete application configuration with minimal overrides
  - Only mock true external dependencies (third-party services, payment processors, etc.)
  - Use a dedicated test database to ensure test isolation

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

- Test complete user flows through the API using the actual application with real service implementations.
- Avoid mocking internal services in E2E tests - use the complete dependency chain to test the full system integration.
- Use a dedicated test database (preferably in-memory) to ensure test isolation.
- Focus on testing endpoints and their responses in real-world scenarios.
- Verify that authentication, validation, and business logic work correctly together within the full application context.
- Test the application configuration, middleware, pipes, guards, and interceptors as they would run in production.

### Controller E2E Testing

- Test API endpoints with real HTTP requests against a fully configured application.
- Use real service implementations throughout the dependency chain whenever possible.
- Verify request validation, authentication, and authorization with actual middleware, guards, and pipes.
- Test success and error responses in real-world scenarios.
- Only mock true external dependencies that would connect to third-party systems.

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

- Test multi-step user flows with real service implementations throughout the dependency chain.
- Verify that state is correctly maintained between requests using the actual service implementations.
- Test that business rules are enforced correctly across the entire application.
- Use real services to validate cross-cutting concerns like notifications, validations, and access control.

#### Example of a Comprehensive E2E Test with Real Services

```typescript
// Example of a comprehensive E2E test with real service implementations
describe('Loan Application and Approval Flow (e2e with real services)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let connection: Connection;
  let userService: UserService;
  let loanService: LoanService;
  
  // Test users and tokens
  let borrowerToken: string;
  let lenderToken: string;
  const testBorrowerId = 'test-borrower-id';
  const testLenderId = 'test-lender-id';

  beforeAll(async () => {
    // Create the complete application with almost no mocks
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Import the entire application module including all its dependencies
        AppModule, 
        
        // Override database connection to use in-memory SQLite
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: () => ({
            type: 'sqlite',
            database: ':memory:',
            entities: [
              ApplicationUser, 
              UserProfile, 
              Loan, 
              Payment, 
              LoanTerms,
              NotificationDefinition
            ],
            synchronize: true,
            logging: false,
          }),
          inject: [ConfigService],
        }),
      ],
    })
      // Only mock external services that would connect to third-party systems
      .overrideProvider(IPaymentGatewayService)
      .useValue({
        processPayment: jest.fn().mockResolvedValue({ 
          id: 'test-payment-id',
          status: 'completed'
        }),
        refundPayment: jest.fn().mockResolvedValue(true),
      })
      .overrideProvider(INotificationDistributionService)
      .useValue({
        sendNotification: jest.fn().mockResolvedValue(true),
      })
      .compile();

    // Create full application including pipes, guards, interceptors
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    
    // Get services directly from the application's DI container
    connection = moduleFixture.get<Connection>(Connection);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    userService = moduleFixture.get<UserService>(UserService);
    loanService = moduleFixture.get<LoanService>(LoanService);
    
    // Seed test data using the actual services (not SQL queries)
    // This exercises the real service implementations
    const passwordHash = await bcrypt.hash('Password123', 10);
    
    // Create borrower user
    const borrower = await userService.createUser({
      id: testBorrowerId,
      email: 'borrower@example.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'Borrower',
      role: UserRole.BORROWER,
      isActive: true,
    });
    
    // Create lender user
    const lender = await userService.createUser({
      id: testLenderId,
      email: 'lender@example.com',
      passwordHash,
      firstName: 'Test',
      lastName: 'Lender',
      role: UserRole.LENDER,
      isActive: true,
    });
    
    // Generate real JWT tokens
    borrowerToken = jwtService.sign({ 
      sub: borrower.id, 
      email: borrower.email,
      role: UserRole.BORROWER
    });
    
    lenderToken = jwtService.sign({ 
      sub: lender.id, 
      email: lender.email,
      role: UserRole.LENDER
    });
  });

  afterAll(async () => {
    await connection.close();
    await app.close();
  });

  it('should complete full loan lifecycle with real service implementations', async () => {
    // Step 1: Borrower creates loan request
    const createLoanResponse = await request(app.getHttpServer())
      .post('/loans/request')
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({
        amount: 1000,
        purpose: 'Home repair',
        termMonths: 12,
      })
      .expect(201);
    
    const loanId = createLoanResponse.body.id;
    
    // Verify real service state after request creation
    const loanAfterCreation = await loanService.getLoanById(loanId);
    expect(loanAfterCreation.status).toBe(LoanStatus.PENDING);
    expect(loanAfterCreation.borrowingUserId).toBe(testBorrowerId);

    // Step 2: Lender approves loan request
    await request(app.getHttpServer())
      .patch(`/loans/${loanId}/approve`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(200);
    
    // Step 3: Verify loan status was updated using real service implementation
    const loanAfterApproval = await loanService.getLoanById(loanId);
    expect(loanAfterApproval.status).toBe(LoanStatus.APPROVED);
    expect(loanAfterApproval.lendingUserId).toBe(testLenderId);
    
    // Step 4: Lender funds the approved loan
    await request(app.getHttpServer())
      .post(`/loans/${loanId}/fund`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .send({
        paymentMethodId: 'test-payment-method',
      })
      .expect(200);
    
    // Step 5: Borrower makes a payment
    const paymentResponse = await request(app.getHttpServer())
      .post(`/loans/${loanId}/payments`)
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({
        amount: 100,
        paymentMethodId: 'test-payment-method',
      })
      .expect(201);
    
    // Step 6: Verify final state using real service implementation
    const payments = await loanService.getLoanPaymentsByLoanId(loanId);
    expect(payments).toHaveLength(1);
    expect(payments[0].amount).toBe(100);
    expect(payments[0].status).toBe(PaymentStatus.COMPLETED);
  });
});
```

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

ZNG uses `pg-mem` for in-memory PostgreSQL database testing. Use the `memoryDataSourceForTests` utility function to set up test databases with proper schema isolation.

#### Basic Database Setup for Integration Tests

```typescript
import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { Test, TestingModule } from '@nestjs/testing';
import { memoryDataSourceForTests } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entities';
import { DbSchemaCodes } from '@library/shared/common/data';

describe('Service Integration Tests', () => {
  let module: TestingModule;
  let service: YourService;
  let databaseBackup: IBackup;

  beforeAll(async () => {
    // Create in-memory database with appropriate schema
    const memoryDBinstance = await memoryDataSourceForTests({ 
      entities: [...AllEntities], 
      schema: DbSchemaCodes.Core // Use appropriate schema: Core, Payment, or Notification
    });
    const { dataSource, database } = memoryDBinstance;
    
    // Initialize transactional context
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    // Create test module with real database connection
    module = await Test.createTestingModule({ 
      imports: [YourModule] // Import the actual module
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    service = module.get<YourService>(YourService);
    databaseBackup = database.backup();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(() => {
    // Restore database to clean state before each test
    databaseBackup.restore();
  });

  // Your tests here
});
```

#### Schema Selection Guidelines

- **Core API tests**: Use `DbSchemaCodes.Core`
- **Payment API tests**: Use `DbSchemaCodes.Payment` 
- **Notification API tests**: Use `DbSchemaCodes.Notification`

#### Database Backup and Restore Pattern

Use the backup/restore pattern to ensure test isolation:
- Create a backup after initial database setup in `beforeAll`
- Restore the backup in `beforeEach` to reset database state
- This is much faster than recreating the database for each test

#### Real Service Implementation with Database

```typescript
// Example for Payment domain integration test
describe('PaymentDomainService Integration', () => {
  let module: TestingModule;
  let paymentDomainService: PaymentDomainService;
  let databaseBackup: IBackup;

  beforeAll(async () => {
    const memoryDBinstance = await memoryDataSourceForTests({ 
      entities: [...AllEntities], 
      schema: DbSchemaCodes.Payment // Payment entities use Payment schema
    });
    const { dataSource, database } = memoryDBinstance;
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    module = await Test.createTestingModule({ 
      imports: [DomainModule, DataModule] // Use real modules
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    paymentDomainService = module.get<PaymentDomainService>(PaymentDomainService);
    databaseBackup = database.backup();
  });

  beforeEach(() => {
    databaseBackup.restore();
  });

  it('should create and retrieve payment with real database', async () => {
    // Test with actual database operations
    const payment = await paymentDomainService.createPayment(mockPaymentData);
    const retrieved = await paymentDomainService.getPaymentById(payment.id);
    
    expect(retrieved).toEqual(expect.objectContaining({
      id: payment.id,
      amount: mockPaymentData.amount
    }));
  });
});
```

---

## Best Practices

### Test Coverage

- Aim for high test coverage, particularly for critical business logic.
- Use Jest's coverage reports to identify areas that need more testing.
- Focus on quality over quantity—ensure tests are meaningful and cover edge cases.

### Real Service Implementation Testing

- Prefer testing with real service implementations for up to 2-3 levels of dependency.
- Only mock repositories, external APIs, and cross-boundary services.
- Use in-memory databases for integration and E2E tests to ensure test isolation and performance.
- Separate tests that use real service implementations from pure unit tests to maintain clear test organization.
- When using real service implementations, test cross-cutting concerns like validation and error handling.

### Performance

- Keep tests fast by using in-memory databases and selective mocking of expensive operations.
- Use `beforeAll` and `afterAll` hooks for expensive setup/teardown operations.
- For tests with real service implementations, reuse the test fixture across related test cases.

### Maintainability

- Keep test code as clean and maintainable as production code.
- Use helper functions and utilities to reduce duplication.
- Follow the same coding standards and patterns as the rest of the codebase.

### Test Organization

- Group tests logically by feature or component.
- Use descriptive test names that clearly indicate what is being tested.
- Include both positive and negative test cases.

### Real Service Testing Strategy for ZNG

Below is a comprehensive guide on applying real service implementations in integration and E2E tests specifically for the ZNG architecture:

#### Applying Real Service Testing to ZNG's Architecture

ZNG's architecture is designed with a clear separation of concerns and dependency injection principles, making it ideal for integration and E2E testing with real service implementations. Follow these guidelines when implementing real service tests in the ZNG project:

#### Core Business Domains

In the ZNG architecture, core business domains include:

1. **Lending Domain** (`apps/core/src/lending`):
   - Contains LoanService, PaymentService, and other loan-related services
   - Always use real implementations in integration and E2E tests

2. **User Domain** (`apps/core/src/users`):
   - Contains UserService, AuthService, and user-related services
   - Always use real implementations in integration and E2E tests

3. **Notification Domain** (`apps/notification/src/domain`):
   - Contains NotificationService and notification-related services
   - Always use real implementations in integration and E2E tests

4. **Payment Domain** (`apps/payment/src/domain`):
   - Contains TransferService, AccountService, and payment-related services
   - Always use real implementations in integration and E2E tests

#### Service Testing Layering Strategy for ZNG

1. **Domain Services** (e.g., `LoanService`, `UserService`):
   - Use real implementations in both integration and E2E tests
   - Example: When testing `AuthService`, use the real `UserService` implementation

2. **Infrastructure Services** (e.g., `EmailService`, `LoggingService`):
   - Use real implementations in E2E tests
   - May mock in unit/integration tests if they have external dependencies
   - Example: Mock `EmailService` in integration tests but use real implementation in E2E tests

3. **External Services** (e.g., `PaymentGatewayService`, third-party APIs):
   - Always mock in both integration and E2E tests
   - Example: Mock `PaymentGatewayService` that would connect to Stripe or PayPal

#### Repository Tests in ZNG

For ZNG's repository testing strategy:

1. **Standard Repository Methods**:
   - Provided by `RepositoryBase<T>` - no need to test extensively
   - Focus on testing custom repository methods

2. **Custom Repository Methods**:
   - Test with real TypeORM connections using in-memory SQLite database
   - Use the actual entity models rather than mocks

#### Practical Implementation in ZNG

##### Creating Test Modules for Integration Tests

For ZNG integration tests, create test modules that:

1. Import related domain modules
2. Use real services for 2-3 dependency levels
3. Mock only repositories and external dependencies

Example for LoanService integration tests:

```typescript
// Test module for loan domain integration tests
const createTestModule = async () => {
  return await Test.createTestingModule({
    imports: [
      // Import domain modules with real service implementations
      LoanDomainModule,
      UserDomainModule,
      NotificationModule,
      
      // Configure in-memory database
      TypeOrmModule.forRoot({
        type: 'sqlite',
        database: ':memory:',
        entities: [ApplicationUser, Loan, Payment, LoanTerms, UserProfile],
        synchronize: true,
      }),
    ],
    providers: [
      // Additional providers if needed
    ],
  })
  // Mock repositories and external services only
  .overrideProvider(IExternalPaymentGatewayService)
  .useValue(mockPaymentGateway)
  .compile();
};
```

##### E2E Test Structure for ZNG

For ZNG E2E tests, use the test fixtures in the respective `/test` directories:

1. **Core API**:
   - Test files in `apps/core/test/` 
   - Tests should exercise full API flows with real services
   - Example: Complete loan application process from request to payment

2. **Notification API**:
   - Test files in `apps/notification/test/`
   - Tests should verify notification delivery flows with real service implementations
   - Mock only external notification channels

3. **Payment API**:
   - Test files in `apps/payment/test/`
   - Tests should verify payment processing with real service implementations
   - Mock only external payment gateways

##### Example Test Implementation for ZNG Architecture

For example, when testing the loan approval flow:

```typescript
// apps/core/test/lending/loan-approval.e2e-spec.ts
describe('Loan Approval E2E', () => {
  let app: INestApplication;
  let loanService: LoanService;
  let userService: UserService;
  let notificationService: NotificationService;
  
  beforeAll(async () => {
    // Create test module with real implementations
    const moduleFixture = await Test.createTestingModule({
      imports: [CoreModule], // Import entire core module
    })
    .overrideProvider(IPaymentGatewayService)
    .useValue(mockPaymentGateway)
    .compile();
    
    // Configure app with all middleware, pipes, guards
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
    
    // Get real service implementations from DI container
    loanService = moduleFixture.get<LoanService>(LoanService);
    userService = moduleFixture.get<UserService>(UserService);
    notificationService = moduleFixture.get<NotificationService>(NotificationService);
    
    // Rest of the setup...
  });
  
  it('should approve and fund a loan with real service interactions', async () => {
    // Test implementation that uses real services
    // ...
  });
});
```

By following these guidelines, ZNG's tests will validate real service interactions while maintaining test isolation and reliability.

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
- `// Use real service implementations for this integration test (2-3 levels deep)`
- `// Only mock repositories and external APIs, use real service implementations for everything else`
- `// Create a comprehensive E2E test with real services to validate the entire flow`
- `// Use TestingModule to get actual service implementations from the DI container`
- `// This is a cross-cutting test - use real service implementations to validate interactions`
