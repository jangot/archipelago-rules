module.exports = {
  // File extensions to look for
  moduleFileExtensions: ['js', 'json', 'ts'],

  // The root of your source code, typically your project root
  rootDir: '.',

  // A regex pattern that Jest uses to detect test files
  testRegex: '.*\\.spec\\.ts$',

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ['**/*.(t|j)s'],

  // The directory where Jest should output its coverage files
  coverageDirectory: './coverage',

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // Changing timeout to 5 minutes to allow for debugging tests locally
  testTimeout: process.env.DEBUG_TESTS ? 300000 : 5000,

  // An array of directory paths to be searched recursively up from the requiring module's location
  roots: ['<rootDir>/libs/', '<rootDir>/apps/'],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@library/entity(|/.*)$': '<rootDir>/libs/entity/src/$1',
    '^@library/extensions(|/.*)$': '<rootDir>/libs/extensions/src/$1',
    '^@library/shared(|/.*)$': '<rootDir>/libs/shared/src/$1',
    '^@core(|/.*)$': '<rootDir>/apps/core/src/$1',
    '^@payment(|/.*)$': '<rootDir>/apps/payment/src/$1',
    '^@notification(|/.*)$': '<rootDir>/apps/notification/src/$1',
  },
  
  // Include custom setup files that run after the test framework has been set up
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};
