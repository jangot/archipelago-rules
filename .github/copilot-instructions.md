## ZNG Project Overview

ZNG is a NestJS monorepo built with TypeScript, providing 3 main RESTful API services and 1 shared library. The backend uses PostgreSQL, with TypeORM for ORM, PassportJs for authentication, and Pino for logging.

---

## Monorepo Structure

- **apps/**: Contains individual NestJS applications (RESTful APIs).
- **libs/**: Shared libraries, common utilities, DTOs, interfaces, and shared configurations.

---

## Technology Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **ORM**: TypeORM (PostgreSQL)
- **Authentication**: PassportJs
- **Logging**: Pino
- **Database**: PostgreSQL
- **Documentation**: JSDoc
- **API Documentation**: Swagger (OpenAPI)

---

## Coding Standards and Best Practices

### TypeScript

- Always explicitly type functions, variables, and parameters.
- Prefer interfaces for defining data shapes, especially for DTOs.
- Follow the project's established code style.
- Always use single quotes for string literals.
- Maintain consistent indentation using two spaces.

### NestJS

- Follow NestJS modular architecture strictly. Each module encapsulates domain-specific logic.
- Keep controllers thin—delegate all business logic to services.
- Use NestJS decorators (`@Controller`, `@Injectable`, `@Module`) appropriately.
- Implement dependency injection correctly using the `@Injectable()` decorator and constructor injection.
- Handle asynchronous operations using `async/await` and `Promises` where appropriate.
- Properly utilize Guards, Pipes, Filters, and Interceptors provided by NestJS.

### API Design

- Follow RESTful API principles.
- Use meaningful and consistent endpoint names.
- Implement proper HTTP status codes for responses.
- Validate request data using DTOs and class-validator.

### Error Handling

- Use try-catch blocks to handle exceptions gracefully.
- Throw custom exceptions or HTTP exceptions provided by NestJS.
- Log errors using the built-in `Logger` service.
- Avoid generic catch blocks without specific error handling.

### Security

- Sanitize user inputs to prevent XSS attacks.
- Use parameterized queries or ORM methods to prevent SQL injection.
- Implement authentication and authorization using JWT or other appropriate methods.
- Protect sensitive data using environment variables and secure configuration.

### Testing

- Write unit tests for all services and controllers using Jest and Supertest.
- Aim for high test coverage.
- Use mocks and stubs to isolate units under test.
- Write integration tests for end-to-end functionality.

### TypeORM

- Define entities clearly and maintain consistent entity-to-table mappings.
- Avoid directly using repositories in controllers—always abstract them within services.
- Use migrations for schema management; never synchronize automatically in production.
- Leverage transactions properly for operations that span multiple database entities.

### PassportJs Authentication

- Follow standard authentication strategies (JWT, Local, OAuth) provided by PassportJs.
- Ensure strategies are encapsulated neatly within the `auth` modules.
- Keep authentication middleware minimal, delegating validation logic to dedicated services.

### Logging (Pino)

- Use structured logging consistently across all apps and libraries.
- Clearly log important events, warnings, errors, and informational messages.
- Do not log sensitive data, such as passwords or tokens.
- Maintain log correlation (e.g., correlation IDs for request tracing).

### Dtos
- Add `Request` to the name of incoming parameters for API endpoints
- Add `Response` to the name of result classes for API endpoints
- Decorate Dtos with class-validator decorators as appropriate

### Entities
- Decorate Entity classes with TypeORM decorators as appropriate
- All entity classes must implement their corresponding interface from the `libs/entity/src/interface` folder
- First define the entity interface in `libs/entity/src/interface` directory, then implement it in the entity class
- Example: `ApplicationUser` implements `IApplicationUser`, `NotificationDefinition` implements `INotificationDefinition`
- This pattern enables dependency injection with interfaces rather than concrete implementations and facilitates testing

### Repository Interfaces
- All repository interfaces must extend `IRepositoryBase<T>` with the appropriate entity interface
- Repository interfaces must export a Symbol constant with the same name as the interface
- Example: `export interface IUserRepository extends IRepositoryBase<IApplicationUser> { ... }`
- Example: `export const IUserRepository = Symbol('IUserRepository');`
- Only add custom methods to repository interfaces when they provide functionality beyond the base repository

### Repository Implementations
- All repository implementations must extend `RepositoryBase<Entity>` and implement the corresponding interface
- Include a private logger property initialized with the class name: `private readonly logger: Logger = new Logger(ClassName.name);`
- Do not implement methods already provided by `RepositoryBase` class
- Use proper constructor injection with `@InjectRepository` decorator
- Example:
```typescript
@Injectable()
export class UserRepository extends RepositoryBase<User> implements IUserRepository {
  private readonly logger: Logger = new Logger(UserRepository.name);
  
  constructor(
    @InjectRepository(User)
    repository: Repository<User>,
  ) {
    super(repository, User);
  }
  
  // Only implement custom methods not provided by RepositoryBase
}
```

### General guidelines
- Write clear and concise comments for each function and method using JsDoc format.
- Always prioritize readability and clarity.
- Write code with good maintainability practices, including comments on why certain design decisions were made.
- Use consistent naming conventions and follow language-specific best practices.
- Write concise, efficient, and idiomatic code that is also easily understandable.
- Avoid generating code verbatim from public code examples. Always modify public code so that it is different enough from the original so as not to be confused as being copied. When you do so, provide a footnote to the user informing them.
- Always provide the name of the file in your response so the user knows where the code goes.
- Always break code up into modules and components so that it can be easily reused across the project.
- All code you write MUST use safe and secure coding practices. 'safe and secure' includes avoiding clear passwords, avoiding hard coded passwords, and other common security gaps.
- All code you write MUST be fully optimized. 'Fully optimized' includes maximizing algorithmic big-O efficiency for memory and runtime, following proper style conventions for the code, language (e.g. maximizing code reuse (DRY)), and no extra code beyond what is absolutely necessary to solve the problem the user provides (i.e. no technical debt).
- All generated .ts files must end with a blank line as per prettier guidelines.
- Whenever you are provided clarifying instructions or are told to redo / fix code that you generated, update this file with 
clear and concise instructions to ensure that the code is generated properly next time.

---

## Architectural Principles

### DRY (Don't Repeat Yourself)

- Place all common logic, DTOs, validators, and interceptors in the shared library (`libs`).
- Refactor repetitive code into reusable services, utilities, or decorators.

### SOLID Principles

- **Single Responsibility Principle (SRP)**: Each class or function must have only one responsibility.
- **Open/Closed Principle (OCP)**: Write code that is open for extension but closed for modification.
- **Liskov Substitution Principle (LSP)**: Subclasses or implementations must be fully substitutable for their base classes/interfaces without altering correctness.
- **Interface Segregation Principle (ISP)**: Prefer many small, client-specific interfaces over large generic ones.
- **Dependency Inversion Principle (DIP)**: Depend on abstractions rather than concrete implementations.

### Composition over Inheritance

- Favor object composition (services injecting other services) over class inheritance to extend functionality.
- Avoid deep inheritance chains, prefer clearly-defined interfaces and injected dependencies.

### Loose Coupling and High Cohesion

- Keep modules and services loosely coupled; depend on interfaces rather than concrete implementations.
- Ensure high internal cohesion within modules—group related functionalities closely together.
- Clearly define module boundaries and interactions via well-defined interfaces.

### Documentation

- Write clear and concise comments for complex logic.
- Generate API documentation using Swagger or similar tools.
- Update the project's README file with relevant information.
---

## Copilot Comments Usage

To guide GitHub Copilot effectively in your IDE, include inline comments referencing these guidelines. For example:

- `// Follow NestJS and TypeORM best practices to define this repository method`
- `// Implement SOLID principles and prefer composition over inheritance here`
- `// Maintain loose coupling and high cohesion in this service implementation`
