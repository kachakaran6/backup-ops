import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import {
  NotificationIntegration,
  NotificationProviderType,
} from './entities/notification-integration.entity';
import { NotificationRule } from './entities/notification-rule.entity';
import { NotificationDelivery } from './entities/notification-delivery.entity';
import { TelegramNotificationProvider } from './providers/telegram.provider';
import { SmtpNotificationProvider } from './providers/smtp.provider';
import { PushoverNotificationProvider } from './providers/pushover.provider';
import { GotifyNotificationProvider } from './providers/gotify.provider';
import { INotificationProvider, NotificationTestResult } from './providers/notification.provider.interface';

const DEFAULT_EVENTS = [
  'backup.started',
  'backup.completed',
  'backup.failed',
  'backup.verification_failed',
  'backup.chain_broken',
  'restore.started',
  'restore.completed',
  'restore.failed',
  'storage.low',
  'server.offline',
  'coolify.sync_failed',
];

@Injectable()
export class NotificationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NotificationService.name);
  private readonly providers: Map<NotificationProviderType, INotificationProvider>;
  private readonly encryptionKey: Buffer;

  // In-memory cooldown tracker: key -> timestamp
  private readonly cooldowns = new Map<string, number>();

  constructor(
    @InjectRepository(NotificationIntegration)
    private readonly integrationRepo: Repository<NotificationIntegration>,
    @InjectRepository(NotificationRule)
    private readonly ruleRepo: Repository<NotificationRule>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepo: Repository<NotificationDelivery>,
    private readonly telegramProvider: TelegramNotificationProvider,
    private readonly smtpProvider: SmtpNotificationProvider,
    private readonly pushoverProvider: PushoverNotificationProvider,
    private readonly gotifyProvider: GotifyNotificationProvider,
  ) {
    this.providers = new Map<NotificationProviderType, INotificationProvider>([
      ['telegram', this.telegramProvider],
      ['smtp', this.smtpProvider],
      ['pushover', this.pushoverProvider],
      ['gotify', this.gotifyProvider],
    ]);

    const rawKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'backupops-secret-encryption-salt-default-key-32b';
    this.encryptionKey = crypto.createHash('sha256').update(rawKey).digest();
  }

  async onApplicationBootstrap() {
    // Ensure default rules exist
    await this.ensureDefaultRules('default');
  }

  async ensureDefaultRules(organizationId: string) {
    for (const event of DEFAULT_EVENTS) {
      const existing = await this.ruleRepo.findOne({ where: { organizationId, event } });
      if (!existing) {
        await this.ruleRepo.save({
          organizationId,
          event,
          enabled: true,
          integrationIds: [],
          cooldownMinutes: 5,
        });
      }
    }
  }

  // --- Encryption Helpers (AES-256-GCM) ---
  private encrypt(data: any): { ciphertext: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const plaintext = JSON.stringify(data);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }

  private decrypt(ciphertext: string, ivHex: string, authTagHex: string): any {
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (err: any) {
      this.logger.error(`Decryption error: ${err.message}`);
      return {};
    }
  }

  // Mask sensitive fields in configuration for frontend display
  private maskConfig(provider: NotificationProviderType, config: any): any {
    if (!config) return {};
    const masked = { ...config };
    if (masked.password) masked.password = '••••••••';
    if (masked.botToken) masked.botToken = masked.botToken.replace(/^(\d+:).+$/, '$1••••••••');
    if (masked.appToken) masked.appToken = '••••••••';
    if (masked.userKey) masked.userKey = masked.userKey.length > 8 ? `${masked.userKey.slice(0, 4)}••••${masked.userKey.slice(-4)}` : '••••••••';
    return masked;
  }

  // --- Integrations ---
  async listIntegrations(organizationId: string) {
    const integrations = await this.integrationRepo.find({
      where: { organizationId },
      order: { createdAt: 'ASC' },
      select: ['id', 'organizationId', 'provider', 'name', 'enabled', 'status', 'lastTestAt', 'lastSuccessAt', 'lastFailureAt', 'lastError', 'createdAt', 'updatedAt'],
    });

    // Also fetch masked configs
    const results = [];
    for (const item of integrations) {
      const full = await this.integrationRepo.findOne({
        where: { id: item.id },
        select: ['id', 'encryptedConfig', 'configIv', 'configAuthTag'],
      });
      let config = {};
      if (full?.encryptedConfig && full?.configIv && full?.configAuthTag) {
        config = this.decrypt(full.encryptedConfig, full.configIv, full.configAuthTag);
      }
      results.push({
        ...item,
        config: this.maskConfig(item.provider, config),
      });
    }
    return results;
  }

  async getIntegration(organizationId: string, id: string) {
    const item = await this.integrationRepo.findOne({
      where: { id, organizationId },
      select: ['id', 'organizationId', 'provider', 'name', 'enabled', 'status', 'lastTestAt', 'lastSuccessAt', 'lastFailureAt', 'lastError', 'createdAt', 'updatedAt'],
    });
    if (!item) throw new NotFoundException('Integration not found');

    const full = await this.integrationRepo.findOne({
      where: { id: item.id },
      select: ['id', 'encryptedConfig', 'configIv', 'configAuthTag'],
    });
    let config = {};
    if (full?.encryptedConfig && full?.configIv && full?.configAuthTag) {
      config = this.decrypt(full.encryptedConfig, full.configIv, full.configAuthTag);
    }
    return {
      ...item,
      config: this.maskConfig(item.provider, config),
    };
  }

  async createOrUpdateIntegration(
    organizationId: string,
    data: {
      id?: string;
      provider: NotificationProviderType;
      name: string;
      config: any;
      enabled?: boolean;
    },
  ) {
    const { id, provider, name, config, enabled = true } = data;
    if (!this.providers.has(provider)) {
      throw new BadRequestException(`Unsupported notification provider: ${provider}`);
    }

    let existing: NotificationIntegration | null = null;
    let existingConfig: any = {};

    if (id) {
      existing = await this.integrationRepo.findOne({
        where: { id, organizationId },
        select: ['id', 'encryptedConfig', 'configIv', 'configAuthTag'],
      });
      if (existing?.encryptedConfig) {
        existingConfig = this.decrypt(existing.encryptedConfig, existing.configIv, existing.configAuthTag);
      }
    }

    // Merge incoming config with existing (so masked values aren't overwritten with asterisks)
    const finalConfig = { ...existingConfig };
    for (const [k, v] of Object.entries(config || {})) {
      if (typeof v === 'string' && (v.includes('••••') || v.includes('***'))) {
        // preserve existing secret
        continue;
      }
      finalConfig[k] = v;
    }

    const { ciphertext, iv, authTag } = this.encrypt(finalConfig);

    const record = existing ? this.integrationRepo.create({ ...existing }) : new NotificationIntegration();
    if (id) record.id = id;
    record.organizationId = organizationId;
    record.provider = provider;
    record.name = name;
    record.encryptedConfig = ciphertext;
    record.configIv = iv;
    record.configAuthTag = authTag;
    record.enabled = enabled;
    if (!existing) {
      record.status = 'untested';
    }

    const saved = await this.integrationRepo.save(record);
    return this.getIntegration(organizationId, saved.id);
  }

  async deleteIntegration(organizationId: string, id: string) {
    const item = await this.integrationRepo.findOne({ where: { id, organizationId } });
    if (!item) throw new NotFoundException('Integration not found');

    // Clean up references in rules
    const rules = await this.ruleRepo.find({ where: { organizationId } });
    for (const rule of rules) {
      if (rule.integrationIds?.includes(id)) {
        rule.integrationIds = rule.integrationIds.filter((x) => x !== id);
        await this.ruleRepo.save(rule);
      }
    }

    await this.integrationRepo.delete({ id });
    return { success: true };
  }

  async testIntegration(
    organizationId: string,
    id: string,
    overrideConfig?: any,
  ): Promise<NotificationTestResult> {
    const integration = await this.integrationRepo.findOne({
      where: { id, organizationId },
      select: ['id', 'provider', 'name', 'encryptedConfig', 'configIv', 'configAuthTag'],
    });
    if (!integration) throw new NotFoundException('Integration not found');

    const providerInstance = this.providers.get(integration.provider);
    if (!providerInstance) {
      throw new BadRequestException(`Provider ${integration.provider} is not available`);
    }

    let config: Record<string, any> = {};
    if (integration.encryptedConfig && integration.configIv && integration.configAuthTag) {
      config = this.decrypt(integration.encryptedConfig, integration.configIv, integration.configAuthTag) || {};
    }

    if (overrideConfig) {
      for (const [k, v] of Object.entries(overrideConfig)) {
        if (typeof v === 'string' && (v.includes('••••') || v.includes('***'))) continue;
        config[k] = v;
      }
    }

    const result = await providerInstance.test(config);

    // Update integration status
    const updateData: Partial<NotificationIntegration> = {
      lastTestAt: new Date(),
      status: result.success ? 'connected' : 'failed',
    };
    if (result.success) {
      updateData.lastSuccessAt = new Date();
      updateData.lastError = undefined;
    } else {
      updateData.lastFailureAt = new Date();
      updateData.lastError = result.message;
    }

    await this.integrationRepo.update({ id }, updateData);

    // Record delivery attempt
    await this.deliveryRepo.save({
      organizationId,
      integrationId: id,
      event: 'test.notification',
      status: result.success ? 'success' : 'failed',
      attemptedAt: new Date(),
      deliveredAt: result.success ? new Date() : undefined,
      error: result.success ? undefined : result.message,
      payloadSummary: `Test message: ${result.message}`,
    });

    return result;
  }

  // --- Rules ---
  async listRules(organizationId: string) {
    await this.ensureDefaultRules(organizationId);
    return this.ruleRepo.find({
      where: { organizationId },
      order: { event: 'ASC' },
    });
  }

  async updateRule(
    organizationId: string,
    event: string,
    data: { enabled?: boolean; integrationIds?: string[]; cooldownMinutes?: number },
  ) {
    let rule = await this.ruleRepo.findOne({ where: { organizationId, event } });
    if (!rule) {
      rule = this.ruleRepo.create({ organizationId, event });
    }
    if (data.enabled !== undefined) rule.enabled = data.enabled;
    if (data.integrationIds !== undefined) rule.integrationIds = data.integrationIds;
    if (data.cooldownMinutes !== undefined) rule.cooldownMinutes = data.cooldownMinutes;

    return this.ruleRepo.save(rule);
  }

  // --- Deliveries ---
  async listDeliveries(organizationId: string, limit = 50) {
    return this.deliveryRepo.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // --- Event Dispatcher ---
  async dispatchEvent(organizationId: string, event: string, payload: any) {
    try {
      const rule = await this.ruleRepo.findOne({ where: { organizationId, event } });
      if (!rule || !rule.enabled) return;

      const targetIds = rule.integrationIds || [];
      if (targetIds.length === 0) return;

      // Cooldown check: prevent noisy spam for the exact same event & target
      const cooldownKey = `${organizationId}:${event}:${payload?.resourceId || 'global'}`;
      const now = Date.now();
      const lastSent = this.cooldowns.get(cooldownKey) || 0;
      const cooldownMs = (rule.cooldownMinutes || 5) * 60 * 1000;
      if (now - lastSent < cooldownMs) {
        this.logger.debug(`Notification for ${cooldownKey} throttled by cooldown`);
        return;
      }
      this.cooldowns.set(cooldownKey, now);

      for (const integrationId of targetIds) {
        this.dispatchToIntegration(organizationId, integrationId, event, payload).catch((err) => {
          this.logger.error(`Error dispatching to ${integrationId}: ${err.message}`);
        });
      }
    } catch (err: any) {
      this.logger.error(`Failed to dispatch event ${event}: ${err.message}`);
    }
  }

  private async dispatchToIntegration(
    organizationId: string,
    integrationId: string,
    event: string,
    payload: any,
  ) {
    const integration = await this.integrationRepo.findOne({
      where: { id: integrationId, organizationId },
      select: ['id', 'provider', 'enabled', 'encryptedConfig', 'configIv', 'configAuthTag'],
    });
    if (!integration || !integration.enabled) return;

    const providerInstance = this.providers.get(integration.provider);
    if (!providerInstance) return;

    let config = {};
    if (integration.encryptedConfig && integration.configIv && integration.configAuthTag) {
      config = this.decrypt(integration.encryptedConfig, integration.configIv, integration.configAuthTag);
    }

    const attemptedAt = new Date();
    const result = await providerInstance.send(config, event, payload);

    await this.deliveryRepo.save({
      organizationId,
      integrationId,
      event,
      status: result.success ? 'success' : 'failed',
      attemptedAt,
      deliveredAt: result.success ? new Date() : undefined,
      error: result.error,
      payloadSummary: typeof payload === 'object' ? JSON.stringify(payload).slice(0, 500) : String(payload),
    });

    if (result.success) {
      await this.integrationRepo.update({ id: integrationId }, { lastSuccessAt: new Date(), status: 'connected' });
    } else {
      await this.integrationRepo.update({ id: integrationId }, { lastFailureAt: new Date(), lastError: result.error, status: 'failed' });
    }
  }
}
