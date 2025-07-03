import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RegistrationStatus } from '@library/entity/enum/registration.status';
import { VerificationStatus } from '@library/entity/enum/verification.status';
import { LoanStateCodes, LoanTypeCodes, LoanPaymentFrequencyCodes, LoanClosureCodes } from '@library/entity/enum';

/**
 * Registry of pre-seeded test data IDs for consistent reference across tests
 */
export interface ITestDataRegistry {
  users: {
    primaryUser: string;
    secondaryUser: string;
    borrowerUser: string;
    lenderUser: string;
    inactiveUser: string;
  };
  loans: {
    disbursedLoan: string; // was activeLoan - funds transferred to borrower
    requestedLoan: string; // was pendingLoan - loan request created
    repaidLoan: string; // was completedLoan - loan fully repaid
  };
}

/**
 * Well-known UUIDs for foundation test data to ensure consistency across test runs
 */
export const FOUNDATION_TEST_IDS = {
  users: {
    primaryUser: '11111111-1111-1111-1111-111111111111',
    secondaryUser: '22222222-2222-2222-2222-222222222222',
    borrowerUser: '33333333-3333-3333-3333-333333333333',
    lenderUser: '44444444-4444-4444-4444-444444444444',
    inactiveUser: '55555555-5555-5555-5555-555555555555',
  },
  loans: {
    disbursedLoan: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', // was activeLoan - funds transferred to borrower
    requestedLoan: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', // was pendingLoan - loan request created
    repaidLoan: 'cccccccc-cccc-cccc-cccc-cccccccccccc', // was completedLoan - loan fully repaid
  },
} as const;

/**
 * Seeds foundation test data that is commonly used across integration tests.
 * This includes users and loans that serve as the base for most payment operations.
 */
export class TestDataSeeder {
  /**
   * Seeds foundation data (users and loans) into the test database
   * 
   * @param dataSource - The TypeORM DataSource for the test database
   * @returns Promise resolving to test data registry with created entity IDs
   */
  static async seedFoundationData(dataSource: DataSource): Promise<ITestDataRegistry> {
    await TestDataSeeder.createFoundationUsers(dataSource);
    await TestDataSeeder.createFoundationLoans(dataSource);
    
    return FOUNDATION_TEST_IDS;
  }

  /**
   * Creates foundation users with different profiles for testing various scenarios
   */
  private static async createFoundationUsers(dataSource: DataSource): Promise<void> {
    const timestamp = new Date();
    
    // Primary active user - most commonly used
    await dataSource.query(`
      INSERT INTO core.users (
        id, first_name, last_name, email, phone_number, created_at, 
        registration_status, verification_status, verification_attempts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) ON CONFLICT (id) DO NOTHING
    `, [
      FOUNDATION_TEST_IDS.users.primaryUser,
      'John',
      'Doe',
      'john.doe@test.foundation.com',
      '+15551234567',
      timestamp,
      RegistrationStatus.Registered,
      VerificationStatus.Verified,
      0,
    ]);

    // Secondary active user - for multi-user scenarios
    await dataSource.query(`
      INSERT INTO core.users (
        id, first_name, last_name, email, phone_number, created_at, 
        registration_status, verification_status, verification_attempts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) ON CONFLICT (id) DO NOTHING
    `, [
      FOUNDATION_TEST_IDS.users.secondaryUser,
      'Jane',
      'Smith',
      'jane.smith@test.foundation.com',
      '+15551234568',
      timestamp,
      RegistrationStatus.Registered,
      VerificationStatus.Verified,
      0,
    ]);

    // Borrower user - specific role testing
    await dataSource.query(`
      INSERT INTO core.users (
        id, first_name, last_name, email, phone_number, created_at, 
        registration_status, verification_status, verification_attempts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) ON CONFLICT (id) DO NOTHING
    `, [
      FOUNDATION_TEST_IDS.users.borrowerUser,
      'Bob',
      'Borrower',
      'bob.borrower@test.foundation.com',
      '+15551234569',
      timestamp,
      RegistrationStatus.Registered,
      VerificationStatus.Verified,
      0,
    ]);

    // Lender user - specific role testing
    await dataSource.query(`
      INSERT INTO core.users (
        id, first_name, last_name, email, phone_number, created_at, 
        registration_status, verification_status, verification_attempts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) ON CONFLICT (id) DO NOTHING
    `, [
      FOUNDATION_TEST_IDS.users.lenderUser,
      'Lisa',
      'Lender',
      'lisa.lender@test.foundation.com',
      '+15551234570',
      timestamp,
      RegistrationStatus.Registered,
      VerificationStatus.Verified,
      0,
    ]);

    // Inactive user - for edge case testing
    await dataSource.query(`
      INSERT INTO core.users (
        id, first_name, last_name, email, phone_number, created_at, 
        registration_status, verification_status, verification_attempts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) ON CONFLICT (id) DO NOTHING
    `, [
      FOUNDATION_TEST_IDS.users.inactiveUser,
      'Ian',
      'Inactive',
      'ian.inactive@test.foundation.com',
      '+15551234571',
      timestamp,
      RegistrationStatus.NotRegistered,
      VerificationStatus.NotVerified,
      0,
    ]);
  }

  /**
   * Creates foundation loans in different states for testing various scenarios
   */
  private static async createFoundationLoans(dataSource: DataSource): Promise<void> {
    const timestamp = new Date();
    
    // Disbursed loan - most commonly used (funds transferred to borrower)
    await dataSource.query(`
      INSERT INTO core.loans (
        id, borrower_id, lender_id, amount, type, state, closure_type,
        payments_count, payment_frequency, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) ON CONFLICT (id) DO NOTHING
    `, [
      FOUNDATION_TEST_IDS.loans.disbursedLoan,
      FOUNDATION_TEST_IDS.users.borrowerUser,
      FOUNDATION_TEST_IDS.users.lenderUser,
      1000.00,
      LoanTypeCodes.Personal,
      LoanStateCodes.Disbursed,
      LoanClosureCodes.Open,
      12,
      LoanPaymentFrequencyCodes.Monthly,
      timestamp,
    ]);

    // Requested loan - for initiation testing (loan request created)
    await dataSource.query(`
      INSERT INTO core.loans (
        id, borrower_id, lender_id, amount, type, state, closure_type,
        payments_count, payment_frequency, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) ON CONFLICT (id) DO NOTHING
    `, [
      FOUNDATION_TEST_IDS.loans.requestedLoan,
      FOUNDATION_TEST_IDS.users.borrowerUser,
      FOUNDATION_TEST_IDS.users.lenderUser,
      2000.00,
      LoanTypeCodes.Personal,
      LoanStateCodes.Requested,
      LoanClosureCodes.Open,
      24,
      LoanPaymentFrequencyCodes.Monthly,
      timestamp,
    ]);

    // Repaid loan - for historical testing (loan fully repaid)
    await dataSource.query(`
      INSERT INTO core.loans (
        id, borrower_id, lender_id, amount, type, state, closure_type,
        payments_count, payment_frequency, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      ) ON CONFLICT (id) DO NOTHING
    `, [
      FOUNDATION_TEST_IDS.loans.repaidLoan,
      FOUNDATION_TEST_IDS.users.borrowerUser,
      FOUNDATION_TEST_IDS.users.lenderUser,
      500.00,
      LoanTypeCodes.Personal,
      LoanStateCodes.Repaid,
      LoanClosureCodes.Open,
      6,
      LoanPaymentFrequencyCodes.Monthly,
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    ]);
  }

  /**
   * Generates a new unique test ID for test-specific entities
   * Use this for entities that need to be unique per test run
   */
  static generateTestId(): string {
    return uuidv4();
  }

  /**
   * Creates a test-specific user when foundation users are not suitable
   * 
   * @param dataSource - The TypeORM DataSource
   * @param customId - Optional custom ID, generates UUID if not provided
   * @param userProfile - Optional user profile overrides
   * @returns Promise resolving to the created user ID
   */
  static async createTestSpecificUser(
    dataSource: DataSource,
    customId?: string,
    userProfile?: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      registrationStatus: RegistrationStatus;
      verificationStatus: VerificationStatus;
    }>
  ): Promise<string> {
    const userId = customId || TestDataSeeder.generateTestId();
    const timestamp = new Date();
    const uniqueSuffix = Date.now();
    
    await dataSource.query(`
      INSERT INTO core.users (
        id, first_name, last_name, email, phone_number, created_at, 
        registration_status, verification_status, verification_attempts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
    `, [
      userId,
      userProfile?.firstName || 'Test',
      userProfile?.lastName || 'User',
      userProfile?.email || `test.user.${uniqueSuffix}@test.specific.com`,
      userProfile?.phoneNumber || `+1555${String(uniqueSuffix).slice(-7)}`,
      timestamp,
      userProfile?.registrationStatus || RegistrationStatus.Registered,
      userProfile?.verificationStatus || VerificationStatus.Verified,
      0,
    ]);

    return userId;
  }

  /**
   * Creates a test-specific loan when foundation loans are not suitable
   * 
   * @param dataSource - The TypeORM DataSource
   * @param borrowerId - The borrower user ID
   * @param lenderId - The lender user ID
   * @param customId - Optional custom ID, generates UUID if not provided
   * @param loanProfile - Optional loan profile overrides
   * @returns Promise resolving to the created loan ID
   */
  static async createTestSpecificLoan(
    dataSource: DataSource,
    borrowerId: string,
    lenderId: string,
    customId?: string,
    loanProfile?: Partial<{
      amount: number;
      type: string;
      state: string;
      paymentsCount: number;
      paymentFrequency: string;
    }>
  ): Promise<string> {
    const loanId = customId || TestDataSeeder.generateTestId();
    const timestamp = new Date();
    
    await dataSource.query(`
      INSERT INTO core.loans (
        id, borrower_id, lender_id, amount, type, state, closure_type,
        payments_count, payment_frequency, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
      )
    `, [
      loanId,
      borrowerId,
      lenderId,
      loanProfile?.amount || 1500.00,
      loanProfile?.type || LoanTypeCodes.Personal,
      loanProfile?.state || LoanStateCodes.Disbursed,
      LoanClosureCodes.Open,
      loanProfile?.paymentsCount || 18,
      loanProfile?.paymentFrequency || LoanPaymentFrequencyCodes.Monthly,
      timestamp,
    ]);

    return loanId;
  }
}
