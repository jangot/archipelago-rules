import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DataModule } from '../src/data';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { IDataService } from '../src/data/idata.service';
import { memoryDataSource } from './postgress-memory-datasource';
import { ILoanRepository, IUserRepository } from '../src/data/repository/interfaces';
import { v4 } from 'uuid';

describe('DataModule Integration Tests', () => {
    let module: TestingModule;
    let dataService: IDataService;
    let loanRepository: ILoanRepository;
    let userRepository: IUserRepository;

    beforeAll(async () => {
        
        const memoryDB = await memoryDataSource();
        initializeTransactionalContext({ storageDriver: StorageDriver.AUTO});

        module = await Test.createTestingModule({ imports: [DataModule]})
        .overrideProvider(DataSource)
        .useValue(addTransactionalDataSource(memoryDB))
        .compile();

        dataService = module.get<IDataService>(IDataService);
        loanRepository = module.get<ILoanRepository>(ILoanRepository);
        userRepository = module.get<IUserRepository>(IUserRepository);
    });

    afterAll(async () => {
        await module.close();
    });

    it('should be defined', () => {
        expect(dataService).toBeDefined();
        expect(loanRepository).toBeDefined();
        expect(userRepository).toBeDefined();
    });

    it('should get loans by lenderId', async () => {
        const lenderId = v4();
        const loans = await loanRepository.getByLenderId(lenderId);
        expect(loans).toBeInstanceOf(Array);
    });

    it('should get user by id', async () => {
        const userId = v4();
        const user = await userRepository.get(userId);
        expect(user).toBeDefined();
    });
});

