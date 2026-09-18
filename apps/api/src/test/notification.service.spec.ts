import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationService } from '../modules/notification/notification.service';
import { NotificationIntegration } from '../modules/notification/entities/notification-integration.entity';
import { NotificationRule } from '../modules/notification/entities/notification-rule.entity';
import { NotificationDelivery } from '../modules/notification/entities/notification-delivery.entity';
import { TelegramNotificationProvider } from '../modules/notification/providers/telegram.provider';
import { SmtpNotificationProvider } from '../modules/notification/providers/smtp.provider';
import { PushoverNotificationProvider } from '../modules/notification/providers/pushover.provider';
import { GotifyNotificationProvider } from '../modules/notification/providers/gotify.provider';

describe('NotificationService — Notification Abstraction & Encryption', () => {
  let service: NotificationService;
  let integrationRepo: any;
  let ruleRepo: any;
  let deliveryRepo: any;
  let telegramProvider: any;
  let smtpProvider: any;

  beforeEach(async () => {
    const store = new Map<string, any>();
    integrationRepo = {
      find: jest.fn().mockImplementation(() => Promise.resolve(Array.from(store.values()))),
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where?.id) return Promise.resolve(store.get(where.id) || null);
        return Promise.resolve(Array.from(store.values())[0] || null);
      }),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => {
        const id = entity.id || 'int-uuid-1';
        const saved = { id, ...entity };
        store.set(id, saved);
        return Promise.resolve(saved);
      }),
      update: jest.fn().mockImplementation(({ id }, updateData) => {
        const existing = store.get(id) || {};
        store.set(id, { ...existing, ...updateData });
        return Promise.resolve({ affected: 1 });
      }),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    ruleRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 'rule-uuid', ...entity })),
    };

    deliveryRepo = {
      find: jest.fn().mockResolvedValue([]),
      save: jest.fn((entity) => Promise.resolve({ id: 'del-uuid', ...entity })),
    };

    telegramProvider = {
      test: jest.fn().mockResolvedValue({ success: true, message: 'Delivered', latencyMs: 120 }),
      send: jest.fn().mockResolvedValue({ success: true }),
    };

    smtpProvider = {
      test: jest.fn().mockResolvedValue({ success: true, message: 'Sent', latencyMs: 80 }),
      send: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(NotificationIntegration), useValue: integrationRepo },
        { provide: getRepositoryToken(NotificationRule), useValue: ruleRepo },
        { provide: getRepositoryToken(NotificationDelivery), useValue: deliveryRepo },
        { provide: TelegramNotificationProvider, useValue: telegramProvider },
        { provide: SmtpNotificationProvider, useValue: smtpProvider },
        { provide: PushoverNotificationProvider, useValue: {} },
        { provide: GotifyNotificationProvider, useValue: {} },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  describe('createOrUpdateIntegration & Secret Encryption', () => {
    it('should encrypt sensitive configuration before saving to database', async () => {
      await service.createOrUpdateIntegration('default', {
        provider: 'telegram',
        name: 'Alerts Channel',
        config: {
          botToken: '123456789:ABCDefGhiJkLmNo',
          chatId: '98765432',
        },
      });

      expect(integrationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'telegram',
          name: 'Alerts Channel',
          encryptedConfig: expect.any(String),
          configIv: expect.any(String),
          configAuthTag: expect.any(String),
        }),
      );

      // Verify that plaintext botToken is NOT saved in any plain column
      const savedCall = integrationRepo.save.mock.calls[0][0];
      expect(savedCall.botToken).toBeUndefined();
      expect(savedCall.encryptedConfig).not.toContain('123456789:ABCDefGhiJkLmNo');
    });
  });

  describe('testIntegration', () => {
    it('should decrypt stored config and call provider test method', async () => {
      await service.createOrUpdateIntegration('default', {
        id: 'int-1',
        provider: 'telegram',
        name: 'Test Telegram',
        config: { botToken: '123456:secretToken', chatId: '12345' },
      });

      const result = await service.testIntegration('default', 'int-1');

      expect(result.success).toBe(true);
      expect(telegramProvider.test).toHaveBeenCalledWith(
        expect.objectContaining({
          botToken: '123456:secretToken',
          chatId: '12345',
        }),
      );
      expect(deliveryRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'test.notification',
          status: 'success',
        }),
      );
    });
  });
});
