import 'reflect-metadata';

import { INestApplication, Module } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { CqrsModule, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';

import { EventDiscoveryService } from './event-discovery.service';

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

// Test handler with invalid metadata simulation
class InvalidEventHandler {
  handle(event: any) {
    return event;
  }
}

@Module({
  imports: [CqrsModule],
  providers: [
    EventDiscoveryService,
    DiscoveryService,
    UserCreatedEventHandler,
    UserUpdatedEventHandler,
    PaymentProcessedEventHandler,
    InvalidEventHandler,
  ],
  exports: [EventDiscoveryService],
})
class TestAppModule {}

describe('CommandDiscoveryService E2E', () => {
  let app: INestApplication;
  let commandDiscoveryService: EventDiscoveryService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    commandDiscoveryService = app.get<EventDiscoveryService>(EventDiscoveryService);
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
      expect(userCreatedResult).toBe(UserCreatedEvent);
    });

    it('should discover all registered event handlers', () => {
      const userCreatedResult = commandDiscoveryService.findEventByName('UserCreatedEvent');
      const userUpdatedResult = commandDiscoveryService.findEventByName('UserUpdatedEvent');
      const paymentProcessedResult = commandDiscoveryService.findEventByName('PaymentProcessedEvent');

      expect(userCreatedResult).toBeDefined();
      expect(userUpdatedResult).toBeDefined();
      expect(paymentProcessedResult).toBeDefined();

      expect(userCreatedResult).toBe(UserCreatedEvent);
      expect(userUpdatedResult).toBe(UserUpdatedEvent);
      expect(paymentProcessedResult).toBe(PaymentProcessedEvent);
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

    it('should return actual constructor functions', () => {
      const userCreatedResult = commandDiscoveryService.findEventByName('UserCreatedEvent');
      expect(userCreatedResult).toBeDefined();

      const eventClass = userCreatedResult!;
      expect(typeof eventClass).toBe('function');
      expect(eventClass.prototype).toBeDefined();
      expect(eventClass.prototype.constructor).toBe(eventClass);

      // Verify it can be instantiated
      const instance = new eventClass('test-user', 'test@example.com');
      expect(instance).toBeInstanceOf(eventClass);
      expect(instance.userId).toBe('test-user');
      expect(instance.email).toBe('test@example.com');
    });

    it('should handle case sensitivity correctly', () => {
      const userCreatedResult = commandDiscoveryService.findEventByName('UserCreatedEvent');
      expect(userCreatedResult).toBeDefined();

      // Should not find with different case
      const wrongCaseResult = commandDiscoveryService.findEventByName('usercreatedevent');
      expect(wrongCaseResult).toBeUndefined();
    });
  });
});
