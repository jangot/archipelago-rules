import { DataSource } from "typeorm";
import { ApplicationUser, Loan } from "../entity";
import { DATA_SOURCE, RepositoryKey } from "./common";
import { TypeOrmModule } from "@nestjs/typeorm";

/**
 * Collection of Repository Providers for DI in the Data Module
 */
export const repositoryProviders = [
    {
        provide: RepositoryKey.USER, // Defines a string key for @Inject(RepositoryKey)
        useFactory: (dataSource: DataSource) => dataSource.getRepository(ApplicationUser), // Factory that takes certain Reposiory from TypeORM DataSource
        inject: [DataSource] // TypeORM DataSource is injected into the factory
    },
    {
        provide: RepositoryKey.LOAN,
        useFactory: (dataSource: DataSource) => dataSource.getRepository(Loan),
        inject: [DataSource]
    },
]