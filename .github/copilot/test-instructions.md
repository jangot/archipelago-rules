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

### Test Data Generation Requirements

- **All required entities must be created in advance**: Before running any test, ensure all necessary entities (users, loans, accounts, etc.) exist in the database.
- **Group test data generation functions**: All test data creation functions must be placed together within a test file, enclosed by region markers:
  ```typescript
  // #region test data generation
  
  async function createTestUser(): Promise<void> {
    // User creation logic
  }
  
  async function createTestLoan(): Promise<void> {
    // Loan creation logic
  }
  
  async function createFullTestData(): Promise<void> {
    // Complete test data setup
  }
  
  // #endregion
  ```
- **Use descriptive function names**: Name data creation functions clearly (e.g., `createTestUser`, `createPaymentWithAccount`, `createFullTestData`).
- **Handle dependencies properly**: Ensure functions create dependencies in the correct order and validate successful creation.
- **Throw descriptive errors**: If entity creation fails, throw clear error messages to aid debugging.

### Test Entity Creation Requirements

When creating test entities, you must ensure all entity constraints are properly satisfied:

#### Mandatory Field Validation
- **Non-nullable fields**: All required fields must have meaningful and realistic values
- **Foreign key constraints**: Referenced entities must exist before creating dependent entities
- **Unique constraints**: Ensure unique fields (emails, usernames, etc.) use unique values across tests
- **Data type constraints**: Provide values that match the expected data types (strings, numbers, dates, etc.)
- **Enum constraints**: Use valid enum values as defined in the entity interfaces

#### Entity Creation Best Practices

```typescript
// #region test data generation

async function createTestUser(): Promise<IApplicationUser> {
  // Ensure all non-nullable fields are provided with realistic values
  const userData = {
    id: uuidv4(),
    email: `test-${uuidv4()}@example.com`, // Unique email to avoid constraint violations
    firstName: 'John',
    lastName: 'Doe',
    passwordHash: await bcrypt.hash('Password123', 10), // Properly hashed password
    isActive: true, // Boolean field with explicit value
    role: UserRole.BORROWER, // Valid enum value
    createdAt: new Date(),
    updatedAt: new Date(),
    // Ensure no required fields are missing
  };

  const user = await userService.createUser(userData);
  
  if (!user) {
    throw new Error('Failed to create test user - check entity constraints');
  }
  
  return user;
}

async function createTestLoan(): Promise<ILoan> {
  // Create dependent entities first
  const lender = await createTestUser();
  const borrower = await createTestUser();
  
  // Provide all required fields with valid values
  const loanData = {
    id: uuidv4(),
    amount: 5000, // Positive number
    lenderId: lender.id, // Valid foreign key
    borrowerId: borrower.id, // Valid foreign key
    interestRate: 5.5, // Decimal number
    termMonths: 12, // Positive integer
    status: LoanStatus.PENDING, // Valid enum value
    purpose: 'Home improvement', // Non-empty string
    requestedDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    // Include all required fields to avoid constraint violations
  };

  const loan = await loanService.createLoan(loanData);
  
  if (!loan) {
    throw new Error('Failed to create test loan - verify all constraints are satisfied');
  }
  
  return loan;
}

async function createTestPaymentAccount(): Promise<IPaymentAccount> {
  // Create owner first
  const owner = await createTestUser();
  
  const accountData = {
    id: uuidv4(),
    userId: owner.id, // Valid foreign key
    type: PaymentAccountTypeCodes.BankAccount, // Valid enum
    provider: PaymentAccountProviderCodes.Checkbook, // Valid enum
    ownership: PaymentAccountOwnershipTypeCodes.Personal, // Valid enum
    accountHolderName: 'John Doe Smith', // Non-empty string
    accountNumber: '1234567890123456', // Valid format
    routingNumber: '123456789', // Valid format
    state: PaymentAccountStateCodes.Verified, // Valid enum
    isActive: true, // Boolean field
    createdAt: new Date(),
    updatedAt: new Date(),
    // Ensure all validation rules are met
  };

  const account = await paymentService.addPaymentAccount(owner.id, accountData);
  
  if (!account) {
    throw new Error('Failed to create payment account - check field validations');
  }
  
  return account;
}

// #endregion
```

#### Common Entity Constraint Patterns

1. **User Entities**:
   - Email must be unique and valid format
   - Password must be hashed (never plain text)
   - Role must be a valid enum value
   - Active status must be boolean

2. **Loan Entities**:
   - Amount must be positive number
   - Interest rate must be valid decimal
   - Term months must be positive integer
   - Status must be valid enum
   - Lender and borrower must exist

3. **Payment Entities**:
   - Amount must be positive
   - Associated loan/account must exist
   - Provider codes must be valid enums
   - Account numbers must meet format requirements

4. **Date Fields**:
   - CreatedAt/UpdatedAt should be realistic dates
   - Future dates only where business logic requires
   - Use consistent timezone handling

#### Error Handling for Constraint Violations

```typescript
async function createTestEntityWithValidation(): Promise<IEntity> {
  try {
    const entityData = {
      // Provide all required fields
      id: uuidv4(),
      requiredField: 'meaningful_value',
      numericField: 100, // Positive where required
      enumField: ValidEnum.VALUE,
      foreignKeyId: existingEntityId,
      // ... all other required fields
    };

    const entity = await service.createEntity(entityData);
    
    if (!entity) {
      throw new Error('Entity creation returned null - constraint validation failed');
    }
    
    return entity;
  } catch (error) {
    throw new Error(`Failed to create test entity: ${error.message}. Check entity constraints and required fields.`);
  }
}
```

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

### Test Data Generation Requirements for E2E Tests

- **All required entities must be created in advance**: Before running any E2E test, ensure all necessary entities (users, loans, accounts, etc.) exist in the database.
- **Group test data generation functions**: All test data creation functions must be placed together within a test file, enclosed by region markers:
  ```typescript
  // #region test data generation
  
  async function createTestUser(): Promise<void> {
    // User creation logic using real services
  }
  
  async function createTestLoanWithBorrower(): Promise<void> {
    // Complete loan setup with borrower
  }
  
  async function seedCompleteTestData(): Promise<void> {
    // Full E2E test data setup
  }
  
  // #endregion
  ```
- **Use real service implementations for data creation**: In E2E tests, use actual services rather than raw SQL queries when possible.
- **Handle authentication tokens**: Generate and store authentication tokens for different user roles as needed for E2E tests.

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
    // Seed test user with realistic ID
    const testUserId = uuidv4();
    const passwordHash = await bcrypt.hash('Password123', 10);
    await connection.query(`
      INSERT INTO users (id, email, password_hash, is_active)
      VALUES ('${testUserId}', 'test@example.com', '${passwordHash}', true)
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
import { v4 as uuidv4 } from 'uuid';

describe('Loan Application and Approval Flow (e2e with real services)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let connection: Connection;
  let userService: UserService;
  let loanService: LoanService;
  
  // Test users and tokens
  let borrowerToken: string;
  let lenderToken: string;
  const testBorrowerId = uuidv4();
  const testLenderId = uuidv4();

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
          id: uuidv4(),
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
        paymentMethodId: uuidv4(),
      })
      .expect(200);
    
    // Step 5: Borrower makes a payment
    const paymentResponse = await request(app.getHttpServer())
      .post(`/loans/${loanId}/payments`)
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({
        amount: 100,
        paymentMethodId: uuidv4(),
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
        paymentMethodId: uuidv4(),
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
        paymentMethodId: uuidv4(),
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

Create utility functions to generate test data for common entities. All IDs must be generated using `uuid.v4()` to ensure realistic test data.

```typescript
import { v4 as uuidv4 } from 'uuid';

// User test data factory
export const createTestUser = (overrides: Partial<IApplicationUser> = {}): IApplicationUser => ({
  id: uuidv4(),
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
  id: uuidv4(),
  amount: 1000,
  status: 'pending',
  lendingUserId: uuidv4(),
  borrowingUserId: uuidv4(),
  termMonths: 12,
  interestRate: 5.0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
```

### Test ID Management

- **Always use `uuidv4()` for generating test IDs**: Never use hardcoded strings like `'test-id'` or `'user-123'`. All IDs should look realistic.
- **Store frequently used IDs in variables**: When the same ID is needed across multiple test cases, declare it at the test suite level.
- **Generate non-existent IDs for error testing**: Create separate `uuidv4()` IDs specifically for testing error conditions.

```typescript
describe('UserService Integration', () => {
  // Test data IDs - generated once, used across multiple tests
  const validUserId = uuidv4();
  const validLoanId = uuidv4();
  const validAccountId = uuidv4();
  
  // Non-existent IDs for error testing
  const nonExistentUserId = uuidv4();
  const nonExistentLoanId = uuidv4();
  
  // Test implementation...
});
```

### In-Memory Database Setup

ZNG uses `pg-mem` for in-memory PostgreSQL database testing. Use the `memoryDataSourceSingle` utility function to set up test databases with all entities.

#### Recommended Database Setup for Integration and E2E Tests

```typescript
import { IBackup } from 'pg-mem';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 as uuidv4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { memoryDataSourceSingle } from '@library/shared/tests/postgress-memory-datasource';
import { AllEntities } from '@library/shared/domain/entities';

describe('Service Integration Tests', () => {
  let module: TestingModule;
  let service: YourService;
  let databaseBackup: IBackup;

  // Test data IDs - use uuidv4() for realistic test data
  const mockUserId = uuidv4();
  const mockLoanId = uuidv4();
  let mockAccountId: string;
  let mockPaymentId: string;

  // Non-existent IDs for error testing
  const nonExistentUserId = uuidv4();
  const nonExistentLoanId = uuidv4();

  beforeAll(async () => {
    // Create in-memory database with all entities
    const { dataSource, database } = await memoryDataSourceSingle(AllEntities);
    
    // Initialize transactional context
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    // Create test module with real service implementations
    module = await Test.createTestingModule({
      imports: [
        DataModule, // Real data module with repositories
        DomainModule, // Real domain module with services
        YourModule, // Your specific module
      ],
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

  beforeEach(async () => {
    // Restore database to clean state before each test
    databaseBackup.restore();
  });

  // #region test data generation
  
  async function createTestUser(): Promise<void> {
    // Create test user using real service implementations
    const user = await userService.createUser({
      id: mockUserId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      passwordHash: 'hashed_password',
    });
    
    if (!user) {
      throw new Error('Failed to create test user');
    }
  }

  async function createTestLoan(): Promise<void> {
    // Create dependencies first
    await createTestUser();
    
    // Create test loan
    const loan = await loanService.createLoan({
      id: mockLoanId,
      amount: 5000,
      lenderId: mockUserId,
      // ... other required fields
    });
    
    if (!loan) {
      throw new Error('Failed to create test loan');
    }
  }

  async function createFullTestData(): Promise<void> {
    // Create all required entities for complex test scenarios
    await createTestUser();
    await createTestLoan();
    // Add other entities as needed
  }
  
  // #endregion

  // Your tests here
});
```

#### Key Principles for Database Setup

1. **Use `memoryDataSourceSingle(AllEntities)`**: This provides a complete database with all entities, avoiding schema-specific setup complexity. This replaces the older `memoryDataSourceForTests` approach that required schema selection.

2. **Import real modules**: Use actual `DataModule`, `DomainModule`, and specific modules to get real service implementations.

3. **Override only the DataSource**: Replace the DataSource with the in-memory version while keeping all services real.

4. **Use backup/restore pattern**: Create a backup after setup and restore before each test for optimal performance and isolation.

#### Migration from Legacy Approach

- **Replace `memoryDataSourceForTests`**: The newer `memoryDataSourceSingle(AllEntities)` approach is simpler and more reliable.
- **Remove schema-specific imports**: No need to import `DbSchemaCodes` or specify schemas manually.
- **Simplify entity imports**: Just use `AllEntities` instead of manually selecting entity arrays.

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

  // Test data IDs
  const mockUserId = uuidv4();
  const mockLoanId = uuidv4();
  let mockPaymentId: string;

  beforeAll(async () => {
    // Create in-memory database with all entities
    const { dataSource, database } = await memoryDataSourceSingle(AllEntities);
    
    // Initialize transactional context
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

  // #region test data generation
  
  async function createTestPayment(): Promise<void> {
    // Create payment using real service
    const payment = await paymentDomainService.createPayment({
      id: uuidv4(),
      loanId: mockLoanId,
      amount: 1000,
      // ... other required fields
    });
    
    if (!payment) {
      throw new Error('Failed to create test payment');
    }
    
    mockPaymentId = payment.id;
  }
  
  // #endregion

  it('should create and retrieve payment with real database', async () => {
    // Create test data first
    await createTestPayment();
    
    // Test with actual database operations
    const retrieved = await paymentDomainService.getPaymentById(mockPaymentId);
    
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

---

## Summary of Key Testing Updates

### Database Setup Changes
- **New approach**: Use `memoryDataSourceSingle(AllEntities)` instead of `memoryDataSourceForTests`
- **Simplified setup**: No need for schema-specific configuration or `DbSchemaCodes`
- **Import real modules**: Use actual `DataModule`, `DomainModule`, and service modules
- **Override only DataSource**: Replace database connection while keeping all services real

### Test ID Management
- **Always use `uuidv4()`**: Replace all hardcoded test IDs like `'test-id'` with realistic UUIDs
- **Store frequently used IDs**: Declare test IDs at suite level for reuse across test cases
- **Generate realistic error test IDs**: Use separate `uuidv4()` calls for non-existent entity testing

### Test Data Generation
- **Mandatory test data regions**: All test data creation functions must be grouped within:
  ```typescript
  // #region test data generation
  // All test data creation functions here
  // #endregion
  ```
- **Create entities in advance**: Ensure all required entities exist before running tests
- **Use descriptive function names**: Name functions clearly (e.g., `createTestUser`, `createPaymentWithAccount`)
- **Handle dependencies properly**: Create entities in correct order and validate creation success

### Real Service Implementation Strategy
- **Integration tests**: Use real service implementations 2-3 levels deep, mock only repositories and external APIs
- **E2E tests**: Use complete application with real services, mock only true external dependencies
- **Database isolation**: Use backup/restore pattern for optimal performance and test isolation
```
