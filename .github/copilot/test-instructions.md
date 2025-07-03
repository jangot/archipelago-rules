# ZNG Testing Guidelines for Copilot

## Overview
Generate comprehensive, maintainable test suites for the ZNG NestJS monorepo using TypeScript and Jest. Follow these patterns to ensure consistency and reliability.

## Critical Pre-Testing Rules

### Entity Interface Verification (MANDATORY)
- **ALWAYS**: Verify actual entity interfaces before writing any test data
- **NEVER**: Assume field names exist - check `libs/entity/src/interface/` files first
- **UNDERSTAND**: Complex nested types (e.g., PaymentAccountDetails, provider-specific structures)
- **EXAMPLE**: `IPaymentAccount` has no `accountHolderName` - data goes in provider-specific `details` object

```typescript
// ❌ WRONG - These fields don't exist in IPaymentAccount
const paymentAccount = {
  accountHolderName: 'John Doe',  // Doesn't exist!
  accountNumber: '1234567890',    // Doesn't exist!
  routingNumber: '123456789'      // Doesn't exist!
};

// ✅ CORRECT - Using actual IPaymentAccount structure
const paymentAccount = {
  type: PaymentAccountTypeCodes.BankAccount,
  provider: PaymentAccountProviderCodes.Checkbook,
  ownership: PaymentAccountOwnershipTypeCodes.Personal,
  state: PaymentAccountStateCodes.Verified,
  details: {  // Provider-specific data goes here
    type: 'checkbook_ach',
    displayName: 'Account Name',
    key: 'test_key',
    secret: 'test_secret',
    accountId: 'account_id',
    institution: 'Bank Name',
    redactedAccountNumber: '****1234',
    routingNumber: '123456789'
  }
};
```

### Service Scope and Responsibility Testing
- **TEST ONLY**: Methods that belong to the service under test
- **DON'T MIX**: Different service functionalities in same test suite
- **UNDERSTAND DELEGATION**: Some services delegate to factories, test accordingly

```typescript
// ✅ ManagementDomainService has ONLY these 4 methods:
// - initiateLoanPayment(loanId, paymentType)
// - advancePayment(paymentId, paymentType) 
// - advancePaymentStep(stepId, stepState?)
// - executeTransfer(transferId, providerType?)

// ✅ PaymentDomainService handles data operations:
// - addPaymentAccount, createPayment, getLoanById, etc.

// ❌ DON'T test PaymentDomainService methods in ManagementDomainService tests
```

### Method Signature Accuracy (CRITICAL)
- **VERIFY**: Actual method signatures before writing tests
- **CHECK**: Parameter types, return types, optional parameters
- **READ**: The actual service implementation, not just interfaces
- **VALIDATE**: Exception types thrown by checking actual code

## Test Types & Strategy

### Test Classifications
- **Unit Tests** (`*.spec.ts`): Test individual components in isolation with mocked dependencies
- **Integration Tests** (`*.spec.ts`): Test component interactions using real services (2-3 levels deep)
- **E2E Tests** (`*.e2e-spec.ts`): Test complete API flows with minimal mocking

### Core Mocking Strategy
- **Mock**: Repositories, external APIs, third-party services
- **Real**: Business logic services, domain services, validation services, **factories**
- **Database**: Always use `memoryDataSourceSingle(AllEntities)` for test isolation

### Factory and Dependency Management
For integration tests involving services that depend on factories:

```typescript
// ✅ Import actual factory modules for ManagementDomainService
const module = await Test.createTestingModule({
  imports: [
    DataModule,                    // Real data module
    DomainModule,                  // Real domain module
    ManagementModule,              // Management module
    LoanPaymentModule,             // For ILoanPaymentFactory
    LoanPaymentStepModule,         // For ILoanPaymentStepFactory  
    TransferExecutionModule,       // For ITransferExecutionFactory
  ],
}).compile();

// ❌ Missing factory modules will cause "provider not found" errors
```

## Essential Requirements

### Test ID Management (Critical)
```typescript
// ✅ Always use uuidv4() - NEVER hardcoded strings
const testUserId = uuidv4();
const testLoanId = uuidv4();

// ❌ Never use hardcoded IDs
const testUserId = 'test-123';
```

## Hybrid Test Data Approach (Preferred)

### Foundation Data Strategy
Use pre-seeded foundation data for common entities and service calls for domain-specific data:

```typescript
// Import hybrid test utilities
import { 
  memoryDataSourceSingle, 
  TestDataSeeder, 
  FOUNDATION_TEST_IDS, 
  TestPaymentAccountFactory 
} from '@library/shared/tests';

// Setup with foundation data
beforeAll(async () => {
  const { dataSource, database } = await memoryDataSourceSingle(AllEntities);
  
  // Create test module...
  
  // Seed foundation data BEFORE creating backup
  foundationData = await TestDataSeeder.seedFoundationData(dataSource);
  databaseBackup = database.backup();
});

beforeEach(async () => {
  // Restore to state WITH foundation data
  databaseBackup.restore();
});

// Use foundation data in tests
it('should process payment for existing loan', async () => {
  // Use pre-seeded entities (no creation needed)
  const userId = FOUNDATION_TEST_IDS.users.primaryUser;
  const loanId = FOUNDATION_TEST_IDS.loans.disbursedLoan;
  
  // Create domain-specific entities via services
  const account = await domainServices.paymentServices.addPaymentAccount(
    userId,
    TestPaymentAccountFactory.createCheckbookBankAccount()
  );
  
  // Focus on business logic, not setup
  const result = await paymentService.processPayment(loanId, account.id);
  expect(result).toBeDefined();
});
```

### Foundation Data Available
- **Users**: `primaryUser`, `secondaryUser`, `borrowerUser`, `lenderUser`, `inactiveUser`
- **Loans**: `activeLoan`, `pendingLoan`, `completedLoan`
- **Performance**: 50-70% faster test execution vs creating data per test

### When to Use Each Approach
- **Foundation Data**: Common scenarios, performance-critical tests, standard entity relationships
- **Service Calls**: Domain-specific validation, payment accounts, payments, steps
- **Direct SQL**: Edge cases, invalid data, constraint testing, custom scenarios

### Payment Account Factory Usage
```typescript
// Standardized account creation
const account = await domainServices.paymentServices.addPaymentAccount(
  userId,
  TestPaymentAccountFactory.createCheckbookBankAccount('Account Name')
);

// Create account pairs for transfers
const { sourceAccount, destAccount } = await TestPaymentAccountFactory.createAccountPair(
  userId,
  domainServices
);
```

### Test-Specific Data Creation
```typescript
// Create custom entities when foundation data doesn't fit
const customUserId = await TestDataSeeder.createTestSpecificUser(
  dataSource, 
  undefined, 
  {
    registrationStatus: 'pending',
    verificationStatus: 'unverified'
  }
);

const customLoanId = await TestDataSeeder.createTestSpecificLoan(
  dataSource,
  customUserId,
  FOUNDATION_TEST_IDS.users.lenderUser,
  undefined,
  { principalAmount: 25000, status: 'draft' }
);
```

## Test Types & Strategy

### Test Classifications
- **Unit Tests** (`*.spec.ts`): Test individual components in isolation with mocked dependencies
- **Integration Tests** (`*.spec.ts`): Test component interactions using real services (2-3 levels deep)
- **E2E Tests** (`*.e2e-spec.ts`): Test complete API flows with minimal mocking

### Core Mocking Strategy
- **Mock**: Repositories, external APIs, third-party services
- **Real**: Business logic services, domain services, validation services, **factories**
- **Database**: Always use `memoryDataSourceSingle(AllEntities)` for test isolation

### Factory and Dependency Management
For integration tests involving services that depend on factories:

```typescript
// ✅ Import actual factory modules for ManagementDomainService
const module = await Test.createTestingModule({
  imports: [
    DataModule,                    // Real data module
    DomainModule,                  // Real domain module
    ManagementModule,              // Management module
    LoanPaymentModule,             // For ILoanPaymentFactory
    LoanPaymentStepModule,         // For ILoanPaymentStepFactory  
    TransferExecutionModule,       // For ITransferExecutionFactory
  ],
}).compile();

// ❌ Missing factory modules will cause "provider not found" errors
```

## Essential Requirements

### Test ID Management (Critical)
```typescript
// ✅ Always use uuidv4() - NEVER hardcoded strings
const testUserId = uuidv4();
const testLoanId = uuidv4();

// ❌ Never use hardcoded IDs
const testUserId = 'test-123';
```

### Entity State Dependencies and Foreign Key Management
- **UNDERSTAND**: Entity state-dependent operations (e.g., Pending/Failed steps need transfers)
- **CREATE**: Entities in proper dependency order: User → Loan → Payment → Steps → Transfers
- **VALIDATE**: Entity creation success before proceeding
- **HANDLE**: Unique constraints and duplicates gracefully

```typescript
// ✅ Proper dependency order
async function createTestData(): Promise<void> {
  await createUser();           // First - no dependencies
  await createLoan();           // Requires user
  await createPayment();        // Requires loan
  await createPaymentSteps();   // Requires payment and accounts
  await createTransfer();       // Requires steps
}

// ✅ Handle duplicates gracefully
async function createUser(): Promise<void> {
  const existingUser = await dataSource.query('SELECT id FROM users WHERE id = $1', [testUserId]);
  if (existingUser?.length > 0) return; // User already exists
  
  await dataSource.query(`INSERT INTO users (...) VALUES (...)`, [...]);
}

// ✅ Use unique data per test
const userData = {
  email: `test+${Date.now()}@example.com`,  // Unique email
  phone: `+123456789${Date.now().toString().slice(-1)}`,  // Unique phone
};
```

### Complex Data Structure Testing Patterns
Understand and use correct data structures for complex types:

```typescript
// ✅ Correct CheckbookAch PaymentAccountDetails structure
const checkbookAccount = {
  type: PaymentAccountTypeCodes.BankAccount,
  provider: PaymentAccountProviderCodes.Checkbook,
  details: {
    type: 'checkbook_ach',
    displayName: 'Account Name',
    key: 'test_key_123',
    secret: 'test_secret_456',
    accountId: 'acc_123',
    institution: 'Test Bank',
    redactedAccountNumber: '****7890',
    routingNumber: '123456789'
  }
};

// ✅ Correct Fiserv PaymentAccountDetails structure  
const fiservAccount = {
  type: PaymentAccountTypeCodes.BankAccount,
  provider: PaymentAccountProviderCodes.Fiserv,
  details: {
    type: 'fiserv_debit',
    displayName: 'Fiserv Account',
    cardToken: 'token_123',
    cardExpiration: '12/25',
    last4Digits: '1234'
  }
};
```

### Test Data Organization (Mandatory)
All test data creation functions must be grouped within region markers:

```typescript
// #region test data generation

async function createUser(): Promise<void> {
  // Check for existing user to avoid duplicates
  const existingUser = await dataSource.query('SELECT id FROM users WHERE id = $1', [testUserId]);
  if (existingUser?.length > 0) return;
  
  await dataSource.query(`
    INSERT INTO users (id, first_name, last_name, email, phone_number, registration_status)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [testUserId, 'John', 'Doe', `test+${Date.now()}@example.com`, `+123${Date.now()}`, 'completed']);
}

const createTestUser = (): IApplicationUser => ({
  id: uuidv4(),
  email: `test-${uuidv4()}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  // ... all required fields with realistic values
});

const createTestLoan = (userId?: string): ILoan => ({
  id: uuidv4(),
  borrowerId: userId || uuidv4(),
  amount: 5000,
  status: LoanStatus.PENDING,
  // ... all required fields
});

// #endregion test data generation
```

### Database Setup Pattern
```typescript
import { memoryDataSourceSingle } from '@test-utils/memory-datasource-single';
import { AllEntities } from '@libs/entity';
import { v4 as uuidv4 } from 'uuid';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';

beforeAll(async () => {
  const { dataSource, database } = await memoryDataSourceSingle(AllEntities);
  
  // Initialize transactional context for services that use transactions
  initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
  
  const module: TestingModule = await Test.createTestingModule({
    imports: [DomainModule, DataModule], // Real modules
    providers: [ServiceUnderTest],
  })
    .overrideProvider(DataSource)
    .useValue(addTransactionalDataSource(dataSource)) // For transactional support
    .compile();
  
  service = module.get<ServiceUnderTest>(ServiceUnderTest);
  databaseBackup = database.backup();
});

beforeEach(() => {
  databaseBackup.restore(); // Fast test isolation
});
```

## Error Testing Best Practices

### Accurate Error Expectations
- **TEST**: Actual exception types thrown by services  
- **VERIFY**: Error messages match actual implementation
- **UNDERSTAND**: Delegation patterns - factories may throw different exceptions
- **USE**: Realistic error scenarios, not fictional ones

```typescript
// ✅ Test actual exceptions thrown by service implementation
it('should throw EntityNotFoundException when loan not found', async () => {
  await expect(
    managementService.initiateLoanPayment(nonExistentLoanId, LoanPaymentTypeCodes.Funding)
  ).rejects.toThrow('Loan not found'); // Actual message from service
});

// ✅ Test based on actual service behavior  
it('should throw MissingInputException when step ID is undefined', async () => {
  await expect(
    service.advancePaymentStep(undefined)
  ).rejects.toThrow('Missing step ID'); // Actual validation in service
});

// ❌ Don't assume error types without checking implementation
// ❌ Don't test fictional error scenarios
```

## Testing Patterns by Type

### Unit Testing Patterns
```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepository: MockType<IUserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: IUserRepository, useFactory: mockRepositoryFactory }
      ]
    }).compile();

    service = module.get<UserService>(UserService);
    mockRepository = module.get(IUserRepository);
  });

  it('should get user by ID when user exists', async () => {
    // Arrange
    const userId = uuidv4();
    const expectedUser: IApplicationUser = {
      id: userId,
      email: 'test@example.com',
      // ... other required fields
    };
    mockRepository.findOneBy.mockResolvedValue(expectedUser);
    
    // Act
    const result = await service.getUserById(userId);
    
    // Assert
    expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
    expect(result).toEqual(expectedUser);
  });
});
```

### Integration Testing with Real Factories and Services
For integration tests (especially for services that depend on factories):

```typescript
describe('ManagementDomainService Integration', () => {
  let managementDomainService: ManagementDomainService;
  let domainServices: IDomainServices; // For test data creation
  let databaseBackup: IBackup;

  beforeAll(async () => {
    const { dataSource, database } = await memoryDataSourceSingle(AllEntities);
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    // ✅ Include ALL required modules for real factory implementations
    const module = await Test.createTestingModule({
      imports: [
        DataModule,                    // Real data repositories
        DomainModule,                  // Real domain services
        ManagementModule,              // ManagementDomainService
        LoanPaymentModule,             // ILoanPaymentFactory + managers
        LoanPaymentStepModule,         // ILoanPaymentStepFactory + managers
        TransferExecutionModule,       // ITransferExecutionFactory + providers
      ],
    })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(dataSource))
      .compile();

    managementDomainService = module.get<ManagementDomainService>(ManagementDomainService);
    domainServices = module.get<IDomainServices>(IDomainServices);
    databaseBackup = database.backup();
  });

  beforeEach(() => {
    databaseBackup.restore(); // Clean state for each test
  });

  // Test real behavior with proper entity setup
  it('should initiate loan payment with real factory implementation', async () => {
    // Arrange - Create all required entities in proper order
    await createUser();
    await createLoan();
    
    // Act - Test actual service behavior  
    const result = await managementDomainService.initiateLoanPayment(
      testLoanId, 
      LoanPaymentTypeCodes.Funding
    );
    
    // Assert - Based on actual implementation behavior
    expect(result).toBeDefined(); // Real factories return boolean | null
  });
});
```

### Repository Testing Patterns
```typescript
describe('UserRepository', () => {
  let repository: UserRepository;
  let typeOrmRepo: MockType<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        { provide: getRepositoryToken(User), useFactory: mockTypeOrmRepositoryFactory }
      ]
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    typeOrmRepo = module.get(getRepositoryToken(User));
  });

  it('should find active users', async () => {
    // Arrange
    const expectedUsers = [
      { id: uuidv4(), isActive: true },
      { id: uuidv4(), isActive: true }
    ];
    typeOrmRepo.find.mockResolvedValue(expectedUsers);
    
    // Act
    const result = await repository.findActiveUsers();
    
    // Assert
    expect(typeOrmRepo.find).toHaveBeenCalledWith({ where: { isActive: true } });
    expect(result).toEqual(expectedUsers);
  });
});
```

### Service Integration with Real Dependencies
```typescript
describe('AuthService Integration', () => {
  let authService: AuthService;
  let userService: UserService; // Real implementation
  let mockUserRepository: MockType<IUserRepository>;
  let databaseBackup: IBackup;

  beforeAll(async () => {
    const { dataSource, database } = await memoryDataSourceSingle(AllEntities);
    
    const module: TestingModule = await Test.createTestingModule({
      imports: [DomainModule, DataModule],
      providers: [
        AuthService,
        UserService, // Real service
        { provide: IUserRepository, useFactory: mockRepositoryFactory }
      ]
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    mockUserRepository = module.get(IUserRepository);
    databaseBackup = database.backup();
  });

  beforeEach(() => {
    databaseBackup.restore();
    jest.clearAllMocks();
  });

  it('should authenticate user using real UserService', async () => {
    // Arrange
    const loginData = { email: 'user@example.com', password: 'password123' };
    const user: IApplicationUser = {
      id: uuidv4(),
      email: loginData.email,
      passwordHash: await bcrypt.hash('password123', 10),
      isActive: true,
      // ... other required fields
    };
    
    mockUserRepository.findOneBy.mockResolvedValue(user);
    
    // Act - uses real UserService internally
    const result = await authService.validateUser(loginData);
    
    // Assert
    expect(result).toHaveProperty('accessToken');
    expect(result.user.email).toBe(user.email);
  });
});
```

### E2E Testing Patterns

#### Complete API Flow Testing
```typescript
describe('Loan Application Flow (e2e)', () => {
  let app: INestApplication;
  let connection: DataSource;
  let borrowerToken: string;
  let lenderToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Complete application
    })
      // Mock only external services
      .overrideProvider(IPaymentGatewayService)
      .useValue({
        processPayment: jest.fn().mockResolvedValue({ 
          id: uuidv4(), 
          status: 'completed' 
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    
    connection = moduleFixture.get<DataSource>(DataSource);
    
    // Create test users and get tokens using real auth flow
    await createTestUsersAndTokens();
  });

  // #region test data generation
  
  async function createTestUsersAndTokens(): Promise<void> {
    const borrowerData = {
      email: 'borrower@example.com',
      password: 'Password123',
      firstName: 'Test',
      lastName: 'Borrower',
      role: UserRole.BORROWER
    };
    
    const lenderData = {
      email: 'lender@example.com', 
      password: 'Password123',
      firstName: 'Test',
      lastName: 'Lender',
      role: UserRole.LENDER
    };

    // Register users
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(borrowerData)
      .expect(201);
      
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(lenderData)
      .expect(201);

    // Get auth tokens
    const borrowerResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: borrowerData.email, password: borrowerData.password });
    borrowerToken = borrowerResponse.body.accessToken;

    const lenderResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: lenderData.email, password: lenderData.password });
    lenderToken = lenderResponse.body.accessToken;
  }

  // #endregion test data generation

  it('should complete full loan lifecycle using real services', async () => {
    // Step 1: Create loan request
    const loanResponse = await request(app.getHttpServer())
      .post('/loans/request')
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({
        amount: 1000,
        purpose: 'Home repair',
        termMonths: 12,
      })
      .expect(201);
    
    const loanId = loanResponse.body.id;
    expect(loanResponse.body.status).toBe(LoanStatus.PENDING);

    // Step 2: Approve loan
    await request(app.getHttpServer())
      .patch(`/loans/${loanId}/approve`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .expect(200);

    // Step 3: Fund loan
    await request(app.getHttpServer())
      .post(`/loans/${loanId}/fund`)
      .set('Authorization', `Bearer ${lenderToken}`)
      .send({ paymentMethodId: uuidv4() })
      .expect(200);

    // Step 4: Make payment
    const paymentResponse = await request(app.getHttpServer())
      .post(`/loans/${loanId}/payments`)
      .set('Authorization', `Bearer ${borrowerToken}`)
      .send({
        amount: 100,
        paymentMethodId: uuidv4(),
      })
      .expect(201);

    expect(paymentResponse.body.amount).toBe(100);
    expect(paymentResponse.body.status).toBe(PaymentStatus.PENDING);
  });
});
```

## Mock Factories & Test Utilities

### Standard Mock Factories
```typescript
// Repository mock factory
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
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  })),
}));

// TypeORM repository mock factory
export const mockTypeOrmRepositoryFactory = jest.fn(() => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
}));

// Generic service mock factory
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

### Entity Test Data Factories
```typescript
import { v4 as uuidv4 } from 'uuid';

export const createTestUser = (overrides: Partial<IApplicationUser> = {}): IApplicationUser => ({
  id: uuidv4(),
  email: `test-${uuidv4()}@example.com`,
  firstName: 'Test',
  lastName: 'User',
  passwordHash: 'hashed_password_123',
  isActive: true,
  role: UserRole.BORROWER,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestLoan = (overrides: Partial<ILoan> = {}): ILoan => ({
  id: uuidv4(),
  amount: 1000,
  status: LoanStatus.PENDING,
  borrowerId: uuidv4(),
  lenderId: uuidv4(),
  termMonths: 12,
  interestRate: 5.0,
  purpose: 'Test loan',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestPayment = (overrides: Partial<IPayment> = {}): IPayment => ({
  id: uuidv4(),
  amount: 100,
  status: PaymentStatus.PENDING,
  loanId: uuidv4(),
  paymentDate: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
```

## Entity Constraint Validation

### Critical Requirements
1. **Non-nullable fields**: All required fields must have realistic values
2. **Foreign key constraints**: Referenced entities must exist first
3. **Unique constraints**: Use unique values (emails, usernames) across tests
4. **Enum constraints**: Use valid enum values only
5. **Data type constraints**: Match expected types (strings, numbers, dates)

### Common Constraint Patterns
```typescript
// User entity constraints
const validUserData = {
  id: uuidv4(),
  email: `unique-${uuidv4()}@example.com`, // Must be unique
  passwordHash: await bcrypt.hash('Password123', 10), // Must be hashed
  role: UserRole.BORROWER, // Valid enum value
  isActive: true, // Required boolean
};

// Loan entity constraints  
const validLoanData = {
  id: uuidv4(),
  amount: 5000, // Must be positive
  borrowerId: existingUserId, // Must reference existing user
  lenderId: existingUserId, // Must reference existing user
  status: LoanStatus.PENDING, // Valid enum value
  termMonths: 12, // Must be positive integer
  interestRate: 5.5, // Valid decimal
};

// Payment entity constraints
const validPaymentData = {
  id: uuidv4(),
  amount: 100, // Must be positive
  loanId: existingLoanId, // Must reference existing loan
  status: PaymentStatus.PENDING, // Valid enum value
  paymentDate: new Date(), // Valid date
};
```

## Best Practices Summary

### Test Organization
- Follow AAA pattern (Arrange-Act-Assert)
- Use descriptive test names: "should [expected behavior] when [condition]"
- Group related tests with `describe` blocks
- Place tests near the code they test

### Performance & Maintainability
- Use `beforeAll`/`afterAll` for expensive setup/teardown
- Use backup/restore pattern for database isolation
- Keep test code as clean as production code
- Mock expensive operations selectively

### Real Service Testing Strategy
- **Unit tests**: Mock all dependencies
- **Integration tests**: Real services (2-3 levels), mock repositories/external APIs
- **E2E tests**: Real services throughout, mock only external dependencies

## Copilot Guidance Comments

Use these inline comments to guide Copilot effectively:

```typescript
// Follow ZNG testing guidelines - verify entity interfaces first
// Check libs/entity/src/interface/ for actual field names

// Use uuidv4() for all test IDs - never hardcoded strings
const testId = uuidv4();

// Create test data using #region pattern with all required fields
// #region test data generation
const createTestEntity = () => ({
  id: uuidv4(),
  // ... all required fields with realistic values from actual interfaces
});
// #endregion

// Use real service implementations for integration tests (2-3 levels deep)
// Include all required factory modules for services that depend on them
const module = await Test.createTestingModule({
  imports: [
    DomainModule, 
    DataModule,
    LoanPaymentModule,      // For ILoanPaymentFactory
    LoanPaymentStepModule,  // For ILoanPaymentStepFactory
    TransferExecutionModule // For ITransferExecutionFactory
  ],
}).compile();

// Mock only repositories and external APIs in integration tests
.overrideProvider(IRepository)
.useFactory(mockRepositoryFactory)

// Use memoryDataSourceSingle for database setup
const { dataSource, database } = await memoryDataSourceSingle(AllEntities);

// Test actual service behavior, not fictional methods
// Verify error types and messages match actual implementation

// Follow AAA pattern: Arrange-Act-Assert
// Arrange - Create entities in dependency order: User → Loan → Payment → Steps → Transfers
const testData = await createTestEntity();
// Act - Test actual service method  
const result = await service.actualMethod(testData);
// Assert - Based on actual return types and behaviors
expect(result).toEqual(expected);
```

---

## Quick Reference

### Required Imports
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { memoryDataSourceSingle } from '@test-utils/memory-datasource-single';
import { AllEntities } from '@libs/entity';
```

### Test ID Generation
```typescript
// ✅ Always use uuidv4()
const testId = uuidv4();

// ❌ Never use hardcoded strings  
const testId = 'test-123';
```

### Database Setup
```typescript
const { dataSource, database } = await memoryDataSourceSingle(AllEntities);
const databaseBackup = database.backup();

beforeEach(() => {
  databaseBackup.restore();
});
```

### Test Data Regions
```typescript
// #region test data generation
const createTestEntity = () => ({ id: uuidv4(), /* ... actual fields */ });
// #endregion
```

### Entity Interface Verification Checklist
- [ ] Check `libs/entity/src/interface/` for actual field names
- [ ] Understand complex nested types (e.g., PaymentAccountDetails) 
- [ ] Verify service method signatures and return types
- [ ] Test only methods that belong to the service under test
- [ ] Use provider-specific data structures correctly
- [ ] Handle entity state dependencies and foreign keys
- [ ] Create entities in proper dependency order
- [ ] Include all required factory modules for integration tests
