// Mock nestjs-graceful-shutdown before importing any modules
jest.mock('nestjs-graceful-shutdown', () => ({
  GracefulShutdownModule: {
    forRoot: jest.fn(() => ({
      module: class MockGracefulShutdownModule {},
      providers: [],
      exports: [],
    })),
  },
  setupGracefulShutdown: jest.fn(),
}));