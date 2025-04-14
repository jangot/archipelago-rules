import { DataSource, DeepPartial } from 'typeorm';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { v4 } from 'uuid';

import { Test, TestingModule } from '@nestjs/testing';
import { withTransactionHandler } from '@library/shared/common/data/withtransaction.handler';
import { RegistrationStatus, VerificationStatus } from '@library/entity/enum';
import { ILoanRepository, IUserRepository } from '@core/shared/interfaces/repositories';
import { ApplicationUser, Loan } from '@core/domain/entities';
import { CoreDataService } from '@core/data/data.service';
import { DataModule } from '@core/data';

import { memoryDataSource } from './postgress-memory-datasource';

describe('DataModule Integration Tests', () => {
  let module: TestingModule;
  let dataService: CoreDataService;
  let loanRepository: ILoanRepository;
  let userRepository: IUserRepository;

  beforeAll(async () => {
    const memoryDB = await memoryDataSource();
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    module = await Test.createTestingModule({ imports: [DataModule] })
      .overrideProvider(DataSource)
      .useValue(addTransactionalDataSource(memoryDB))
      .compile();

    dataService = module.get<CoreDataService>(CoreDataService);
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
    const user = await userRepository.findOneBy({ id: userId });
    expect(user).toBeDefined();
  });

  describe('Transactional Rollback for duplicate key instert within transaction', () => {
    let expectedLoanId: string;
    let lenderUserId: string;
    let borrowerUserId: string;
    //ID for entities that should not be created
    let fakeLenderId: string;
    let fakeBorrowerId: string;

    it('should create a lender, borrower and a loan', async () => {
      const userCreateSpy = jest.spyOn(dataService.users, 'insert');
      const loanCreateSpy = jest.spyOn(dataService.loans, 'insert');

      // band-aid fixes for defining new variables with 'let'
      // with 'strictNullChecks' TS goes grazy with that
      // currently not fixed (not merged): https://github.com/microsoft/TypeScript/issues/59804
      let lenderResult: ApplicationUser | null = {} as ApplicationUser;
      let lenderGetResult: ApplicationUser | null = {} as ApplicationUser;
      let borrowerResult: ApplicationUser | null = {} as ApplicationUser;
      let borrowerGetResult: ApplicationUser | null = {} as ApplicationUser;
      let loanResult: Loan | null = {} as Loan;
      let loanGetResult: Loan | null = {} as Loan;

      lenderUserId = v4();
      const lenderCreatedAt = new Date();
      const lenderUser: DeepPartial<ApplicationUser> = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test-lender@mail.com',
        id: lenderUserId,
        phoneNumber: '123',
        dateOfBirth: null,
        createdAt: lenderCreatedAt,
        verificationLockedUntil: null,
        pendingEmail: null,
        pendingPhoneNumber: null,
        deletedAt: null,
        registrationStatus: RegistrationStatus.NotRegistered,
        onboardStatus: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
        verificationType: null,
        secret: null,
        secretExpiresAt: null,
        verificationStatus: VerificationStatus.NotVerified,
        verificationAttempts: 0,
      };

      borrowerUserId = v4();
      const borrowerCreatedAt = new Date();
      const borrowerUser: DeepPartial<ApplicationUser> = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test-borrower@mail.com',
        id: borrowerUserId,
        phoneNumber: '456',
        dateOfBirth: null,
        createdAt: borrowerCreatedAt,
        verificationLockedUntil: null,
        pendingEmail: null,
        pendingPhoneNumber: null,
        deletedAt: null,
        registrationStatus: RegistrationStatus.NotRegistered,
        onboardStatus: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
        verificationType: null,
        secret: null,
        secretExpiresAt: null,
        verificationStatus: VerificationStatus.NotVerified,
        verificationAttempts: 0,
      };

      expectedLoanId = v4();
      const expectedLoan: DeepPartial<Loan> = {
        id: expectedLoanId,
        amount: 1000,
        borrowerId: borrowerUserId,
        lenderId: lenderUserId,
        lender: lenderUser,
        borrower: borrowerUser,
      };

      await withTransactionHandler(async () => {
        lenderResult = await dataService.users.insert(lenderUser, true);
        borrowerResult = await dataService.users.insert(borrowerUser, true);
        loanResult = await dataService.loans.insert(expectedLoan, true);
      });
      expect(userCreateSpy).toHaveBeenCalledTimes(2);
      expect(loanCreateSpy).toHaveBeenCalledTimes(1);

      expect(lenderResult).toEqual(lenderUser);
      expect(borrowerResult).toEqual(borrowerUser);
      expect(expectedLoan).toEqual(expect.objectContaining(loanResult));

      // Try to get written entities from database and compare with expected

      lenderGetResult = await dataService.users.findOneBy({ id: lenderUserId });
      borrowerGetResult = await dataService.users.findOneBy({ id: borrowerUserId });
      // Use findOne if you need to load the Relations associated with this Entity, as you can provide
      // options to have it load the relationships as well (findOneBy does not support this functionality)
      loanGetResult = await dataService.loans.findOne({ where: { id: expectedLoanId }, relations: ['lender', 'borrower'] });

      // No longer needed because of switching to using the findOne() method instead of the findOneBy() method
      // Band-aid to solve BaseRepo Lazy Load for this test. Definetely should work in supposed way instead.
      // expectedLoan.lender = undefined;
      // expectedLoan.borrower = undefined;

      expect(lenderGetResult).toEqual(lenderUser);
      expect(borrowerGetResult).toEqual(borrowerUser);
      expect(loanGetResult).toEqual(expectedLoan);
    });

    // Note: should not be running exclusively - only after the previous test (it setup the database entries to be already existed)
    it('should rollback create a lender, borrower and a loan', async () => {
      // now we will try to create fake users and duplicate loan insert
      fakeLenderId = v4();
      const fakeLender: ApplicationUser = {
        id: fakeLenderId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test-fake-lender@mail.com',
        phoneNumber: '123',
        dateOfBirth: null,
        createdAt: new Date(),
        verificationLockedUntil: null,
        pendingEmail: null,
        pendingPhoneNumber: null,
        deletedAt: null,
        registrationStatus: RegistrationStatus.NotRegistered,
        onboardStatus: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
        verificationType: null,
        secret: null,
        secretExpiresAt: null,
        verificationStatus: VerificationStatus.NotVerified,
        verificationAttempts: 0,
      };

      fakeBorrowerId = v4();
      const fakeBorrower: ApplicationUser = {
        id: fakeBorrowerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'test-fake-borrower@mail.com',
        phoneNumber: '456',
        dateOfBirth: null,
        createdAt: new Date(),
        verificationLockedUntil: null,
        pendingEmail: null,
        pendingPhoneNumber: null,
        deletedAt: null,
        registrationStatus: RegistrationStatus.NotRegistered,
        onboardStatus: null,
        addressLine1: null,
        addressLine2: null,
        city: null,
        state: null,
        zipCode: null,
        verificationType: null,
        secret: null,
        secretExpiresAt: null,
        verificationStatus: VerificationStatus.NotVerified,
        verificationAttempts: 0,
      };

      // We set existing loan id to be the same as the one we created in previous test
      // This should cause a conflict and rollback the transaction
      const fakeLoan: Loan = {
        id: expectedLoanId,
        amount: 1000,
        borrowerId: fakeBorrowerId,
        lenderId: fakeLenderId,
        lender: fakeLender,
        borrower: fakeBorrower,
      };

      // Do not await this transaction, as we want to test the rejection with async expect
      const fakeTransaction = withTransactionHandler(async () => {
        await dataService.users.create(fakeLender);
        await dataService.users.create(fakeBorrower);
        await dataService.loans.create(fakeLoan);
      });

      await expect(fakeTransaction).rejects.toThrow();

      const fakeLenderResult = await dataService.users.findOneBy({ id: fakeLenderId });
      const fakeBorrowerResult = await dataService.users.findOneBy({ id: fakeBorrowerId });
      expect(fakeLenderResult).toBe(null);
      expect(fakeBorrowerResult).toBe(null);
    });
  });
});
