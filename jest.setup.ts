// Makes a mock for 'camelcase-keys' library module as Jest can not process it
jest.mock('camelcase-keys', () => ({  camelcaseKeys: jest.fn() }));
