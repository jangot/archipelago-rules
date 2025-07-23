import 'reflect-metadata';
import { INestApplication, Module } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { CqrsModule, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { CommandDiscoveryService } from './command-discovery.service';

class UserCreatedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

class UserUpdatedEvent {
  constructor(
    public readonly userId: string,
    public readonly changes: Record<string, any>,
    public readonly timestamp: Date = new Date(),
  ) {}
}

class PaymentProcessedEvent {
  constructor(
    public readonly paymentId: string,
    public readonly amount: number,
    public readonly status: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

@EventsHandler(UserCreatedEvent)
class UserCreatedEventHandler implements IEventHandler<UserCreatedEvent> {
  handle(event: UserCreatedEvent) {
    return event;
  }
}

@EventsHandler(UserUpdatedEvent)
class UserUpdatedEventHandler implements IEventHandler<UserUpdatedEvent> {
  handle(event: UserUpdatedEvent) {
    return event;
  }
}

@EventsHandler(PaymentProcessedEvent)
class PaymentProcessedEventHandler implements IEventHandler<PaymentProcessedEvent> {
  handle(event: PaymentProcessedEvent) {
    return event;
  }
}

@Module({
  imports: [CqrsModule],
  providers: [
    CommandDiscoveryService,
    DiscoveryService,
    UserCreatedEventHandler,
    UserUpdatedEventHandler,
    PaymentProcessedEventHandler,
  ],
  exports: [CommandDiscoveryService],
})
class TestAppModule {}

describe('CommandDiscoveryService E2E', () => {
  let app: INestApplication;
  let commandDiscoveryService: CommandDiscoveryService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    commandDiscoveryService = app.get<CommandDiscoveryService>(CommandDiscoveryService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Events CQRS Integration', () => {
    it('should discover event handlers through real DiscoveryService', () => {
      const userCreatedResult = commandDiscoveryService.findEventByName('UserCreatedEvent');
      expect(userCreatedResult).toBeDefined();
      expect(userCreatedResult?.eventClass).toBe(UserCreatedEvent);
      expect(userCreatedResult?.handlerClass).toBe(UserCreatedEventHandler);
    });

    it('should discover all registered event handlers', () => {
      const userCreatedResult = commandDiscoveryService.findEventByName('UserCreatedEvent');
      const userUpdatedResult = commandDiscoveryService.findEventByName('UserUpdatedEvent');
      const paymentProcessedResult = commandDiscoveryService.findEventByName('PaymentProcessedEvent');

      expect(userCreatedResult).toBeDefined();
      expect(userUpdatedResult).toBeDefined();
      expect(paymentProcessedResult).toBeDefined();

      expect(userCreatedResult?.eventClass).toBe(UserCreatedEvent);
      expect(userUpdatedResult?.eventClass).toBe(UserUpdatedEvent);
      expect(paymentProcessedResult?.eventClass).toBe(PaymentProcessedEvent);
    });

    it('should return undefined for non-existent events', () => {
      const result = commandDiscoveryService.findEventByName('NonExistentEvent');
      expect(result).toBeUndefined();
    });

    it('should use cache for repeated lookups', () => {
      const firstResult = commandDiscoveryService.findEventByName('UserCreatedEvent');
      expect(firstResult).toBeDefined();

      const secondResult = commandDiscoveryService.findEventByName('UserCreatedEvent');
      expect(secondResult).toBeDefined();
      expect(firstResult).toBe(secondResult);
    });
  });
});
