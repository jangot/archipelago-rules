# ZNG Codebase Folder Structure

This document provides a detailed overview of the physical folder structure of the ZNG monorepo, describing the purpose and typical contents of each main directory and subdirectory as of the current structure.

---

## Root Directory
The root directory contains the main entry point for the project, global configuration files, documentation, and the main source code folder (`zng-api/`). It also includes scripts, environment setup, and meta files used for development and CI/CD.

```
/ (root)
├── apps/                # Main NestJS applications (APIs)
├── db/                  # Database initialization scripts
├── docs/                # Project documentation (Markdown files)
├── envs/                # Environment variable files
├── libs/                # Shared libraries and code used across all apps
├── local/               # Local development scripts, Docker, and environment setup
├── scripts/             # Project-level scripts (build, test, etc.)
├── zng/                 # (Untracked or experimental, not main source)
├── .gitignore           # Git ignore rules
├── README.md            # Project overview
├── eslint.config.mjs    # ESLint configuration
├── jest.config.js       # Jest configuration
├── jest.setup.ts        # Jest setup file
└── ...                  # Other config and meta files
```

---

## apps/
This folder contains all the main NestJS applications (APIs) in the monorepo. Each application is organized in its own subfolder and follows a modular structure.

```
apps/
├── core/           # Core API
├── notification/   # Notification API
├── payment/        # Payment API
```

Each app has a similar structure, but with some variations and feature modules:

```
apps/<app>/
├── src/                    # Main source code for the app
│   ├── core.controller.ts  # Root controller (core only)
│   ├── core.module.ts      # Root module (core only)
│   ├── core.service.ts     # Root service (core only)
│   ├── main.ts             # App entry point (notification, payment)
│   ├── domain/             # Domain logic (services, interfaces, exceptions)
│   ├── data/               # Data access layer (data service, module, migrations, repositories, SQL)
│   ├── infrastructure/     # Repositories, migrations, raw SQL (notification, payment)
│   ├── dto/                # Data Transfer Objects (request/response)
│   ├── modules/            # Feature modules (core only)
│   │   ├── auth/           # Auth module (controllers, services, guards, etc.)
│   │   ├── banking/        # Banking module
│   │   ├── data/           # Data module
│   │   ├── domain/         # Domain module
│   │   ├── lending/        # Lending module
│   │   ├── users/          # Users module
│   │   └── ...             # Other feature modules
│   ├── shared/             # App-specific shared interfaces/repositories
│   │   └── interfaces/
│   │       └── repositories/
│   └── ...                 # Other app-specific files
├── test/                   # End-to-end and integration tests
│   ├── app.e2e-spec.ts
│   ├── auth/
│   ├── lending/
│   ├── user/
│   └── ...
├── tsconfig.app.json       # App-specific TypeScript config
```

#### Example: apps/core/src/modules/data/

The `data` module is responsible for the data access layer of the application. It encapsulates all logic related to database interaction, including raw SQL, migrations, and repository patterns. This module is designed to keep data access concerns separated from business logic, following the principles of modularity and separation of concerns.

- **data.module.ts**: The NestJS module definition for the data layer. Registers providers and repositories for dependency injection.
- **data.service.ts**: Service that provides methods for interacting with the database, often delegating to repositories or executing raw SQL queries.
- **index.ts**: Barrel file for exporting module components.
- **migrations/**: Contains database migration scripts, each representing a schema change. These are executed to update the database schema in a controlled manner.
  - `1738758303036-migration.ts`: A specific migration script, typically auto-generated, that applies a set of schema changes.
- **repositories/**: Contains repository interfaces and implementations for data access. Repositories abstract the details of data persistence and retrieval.
  - `index.ts`: Barrel file for exporting repository interfaces/implementations.
- **sql/**: Contains raw SQL query files for direct database access, used when complex queries are not easily expressed via ORM.
  - `get-user-detail.sql`: A raw SQL file for fetching user details.
- **sql_generated/**: Contains TypeScript files with generated SQL queries, often used for type-safe query execution.
  - `get-user-detail.queries.ts`: TypeScript file exporting SQL queries as constants or functions.

```
apps/core/src/modules/data/
├── data.module.ts                  # NestJS module definition for the data feature
├── data.service.ts                 # Service for data access logic
├── index.ts                        # Barrel file for data module exports
├── migrations/                     # Database migration scripts
│   └── 1738758303036-migration.ts  # Migration script for schema changes
├── repositories/                   # Repository interfaces/implementations for data access
│   └── index.ts                    # Barrel file for repositories
├── sql/                            # Raw SQL queries for data access
│   └── get-user-detail.sql         # SQL file for fetching user details
├── sql_generated/                  # Generated SQL query files
│   └── get-user-detail.queries.ts  # TypeScript file exporting SQL queries
```

#### Example: apps/core/src/modules/domain/

The `domain` module encapsulates the core business logic and domain services of the application. It defines interfaces and service implementations that represent the business rules and operations, independent of data access or presentation concerns.

- **domain.module.ts**: The NestJS module definition for the domain layer. Registers domain services for dependency injection.
- **domain.services.ts**: Aggregates and exports all domain services, acting as a central point for domain logic.
- **idomain.services.ts**: Defines TypeScript interfaces for domain services, promoting abstraction and testability.
- **services/**: Contains the actual implementations of domain services, each encapsulating business logic for a specific domain area.
  - `index.ts`: Barrel file for exporting domain services.
  - `loan.domain.service.ts`: Implements business logic related to loans, such as loan creation, validation, and processing.
  - `user.domain.service.ts`: Implements business logic related to users, such as user management, validation, and operations.

```
apps/core/src/modules/domain/
├── domain.module.ts                # NestJS module definition for the domain feature
├── domain.services.ts              # Service aggregator for domain logic
├── idomain.services.ts             # Interfaces for domain services
├── services/                       # Domain service implementations
│   ├── index.ts                    # Barrel file for domain services
│   ├── loan.domain.service.ts      # Business logic for loans
│   └── user.domain.service.ts      # Business logic for users
```

---

## libs/
This folder contains all shared libraries and code that are reused across multiple applications. It is organized by purpose (shared utilities, domain entities, framework extensions, etc.).

```
libs/
├── entitity/       # Domain entity interfaces, enums, and mappings (note: typo, should be 'entity')
│   └── src/
│       ├── entity-interface/
│       ├── enum/
│       ├── mapping/
│       └── ...
├── extensions/     # TypeORM and other framework extensions
│   └── src/
│       └── typeorm/
├── shared/         # Common utilities, helpers, interfaces, and services
│   └── src/
│       ├── common/
│       │   ├── data/
│       │   ├── domainservice/
│       │   ├── dto/
│       │   ├── event/
│       │   ├── exception/
│       │   ├── filter/
│       │   ├── health/
│       │   ├── helper/
│       │   ├── message/
│       │   ├── middleware/
│       │   ├── paging/
│       │   ├── pipe/
│       │   ├── search/
│       │   └── validator/
│       ├── domain/
│       │   └── entity/
│       ├── infrastructure/
│       │   ├── interface/
│       │   └── repository/
│       ├── interfaces/
│       ├── pino.transport.config.ts
│       ├── service/
│       ├── shared.module.ts
│       ├── tests/
│       └── type/
└── ...
```

---

## db/
This folder contains database initialization scripts.

```
db/
├── database_init.sql
└── ...
```

---

## envs/
This folder contains environment variable files for different environments.

```
envs/
└── ...
```

---

## local/
This folder contains local development scripts, Docker files, and environment setup scripts.

```
local/
├── compose.yml
├── localstack/
│   ├── function.zip
│   ├── localstack-setup.sh
│   └── test-lambda-handler.js
└── ...
```

---

## scripts/
This folder contains project-level scripts for building, testing, and other automation.

```
scripts/
├── build-all.ps1
├── build-all.sh
├── run-jest.sh
└── ...
```

---

## File Placement Guidelines
This section summarizes where to place different types of files in the codebase for consistency and maintainability.

```
# Controllers go in the relevant feature or root folder of each app (e.g., modules/users/users.controller.ts)
# Services go in the same feature or root folder (e.g., modules/users/users.service.ts)
# Domain Services go in domain/services/
# Repositories go in modules/<feature>/repositories/ or infrastructure/repositories/
# DTOs go in dto/request/ and dto/response/ (or modules/<feature>/dto/)
# Entities and Interfaces go in libs/entity/src/entity-interface/ and libs/entity/src/enum/
# Shared utilities go in libs/shared/src/common/
```

---

