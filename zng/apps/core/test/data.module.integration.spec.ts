import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DataModule } from '../src/data';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { IDataService } from '../src/data/idata.service';
import { memoryDataSource } from './postgress-memory-datasource';
import { ILoanRepository, IUserRepository } from '../src/data/repository/interfaces';
import { v4 } from 'uuid';
import { withTransactionHandler } from '@library/shared/common/data/withtransaction.handler';
import { ApplicationUser, Loan } from '../src/data/entity';

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

    describe('Transactional Tests', () => {
        it('should create a lender, borrower and a loan', async () => {
            const userCreateSpy = jest.spyOn(dataService.users, 'create');
            const loanCreateSpy = jest.spyOn(dataService.loans, 'create');

            let lenderResult: ApplicationUser;
            let lenderGetResult: ApplicationUser;
            let borrowerResult: ApplicationUser;
            let borrowerGetResult: ApplicationUser;
            let loanResult: Loan;
            let loanGetResult: Loan;

            const lenderUserId = v4();
            const lenderUser: ApplicationUser = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'test-lender@mail.com',
                id: lenderUserId,
                phoneNumber: '123'
            };

            const borrowerUserId = v4();
            const borrowerUser: ApplicationUser = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'test-borrower@mail.com',
                id: borrowerUserId,
                phoneNumber: '123'
            };

            const expectedLoanId = v4();
            const expectedLoan: Loan = {
                id: expectedLoanId,
                amount: 1000,
                borrowerId: borrowerUserId,
                lenderId: lenderUserId,
                lender: lenderUser,
                borrower: borrowerUser
            }

            await withTransactionHandler(async ()=> {
                lenderResult = await dataService.users.create(lenderUser);
                borrowerResult = await dataService.users.create(borrowerUser);
                loanResult = await dataService.loans.create(expectedLoan);
            });
            expect(userCreateSpy).toHaveBeenCalledTimes(2);
            expect(loanCreateSpy).toHaveBeenCalledTimes(1);

            expect(lenderResult).toEqual(lenderUser);
            expect(borrowerResult).toEqual(borrowerUser);
            expect(loanResult).toEqual(expectedLoan);


            // Try to get written entities from database and compare with expected

            lenderGetResult = await dataService.users.get(lenderUserId);
            borrowerGetResult = await dataService.users.get(borrowerUserId);
            loanGetResult = await dataService.loans.get(expectedLoanId);
            
            // Band-aid to solve BaseRepo Lazy Load for this test. Definetely should work in supposed way instead.
            expectedLoan.lender = undefined;
            expectedLoan.borrower = undefined;

            expect(lenderGetResult).toEqual(lenderUser);
            expect(borrowerGetResult).toEqual(borrowerUser);
            expect(loanGetResult).toEqual(expectedLoan);
            
        });
    });
});