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

### NestJS

- Follow NestJS modular architecture strictly. Each module encapsulates domain-specific logic.
- Keep controllers thin—delegate all business logic to services.
- Use NestJS decorators (`@Controller`, `@Injectable`, `@Module`) appropriately.
- Properly utilize Guards, Pipes, Filters, and Interceptors provided by NestJS.

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

---

## Copilot Comments Usage

To guide GitHub Copilot effectively in your IDE, include inline comments referencing these guidelines. For example:

- `// Follow NestJS and TypeORM best practices to define this repository method`
- `// Implement SOLID principles and prefer composition over inheritance here`
- `// Maintain loose coupling and high cohesion in this service implementation`
