import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationProvider,
  NotificationSendResult,
  NotificationTestResult,
} from './notification.provider.interface';

export interface PushoverConfig {
  appToken: string;
  userKey: string;
  device?: string;
  priority?: number;
}

@Injectable()
export class PushoverNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(PushoverNotificationProvider.name);

  async test(config: PushoverConfig): Promise<NotificationTestResult> {
    const start = Date.now();
    try {
      if (!config.appToken || !config.userKey) {
        return {
          success: false,
          message: 'Application Token and User Key are required.',
          latencyMs: 0,
        };
      }

      const bodyData: Record<string, string> = {
        token: config.appToken,
        user: config.userKey,
        title: 'BackupOps Test Notification',
        message: `Notification integration is working.\nTimestamp: ${new Date().toISOString()}`,
      };
      if (config.device) {
        bodyData.device = config.device;
      }

      const res = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(bodyData).toString(),
        signal: AbortSignal.timeout(10000),
      });

      const latencyMs = Date.now() - start;
      const data = (await res.json().catch(() => ({}))) as any;

      if (!res.ok || data.status !== 1) {
        const errors = Array.isArray(data.errors) ? data.errors.join(', ') : `HTTP ${res.status}`;
        return {
          success: false,
          message: `Pushover delivery failed: ${errors}`,
          latencyMs,
        };
      }

      return {
        success: true,
        message: 'Pushover test notification sent successfully.',
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Pushover connection error: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  async send(config: PushoverConfig, event: string, payload: any): Promise<NotificationSendResult> {
    try {
      const summary = payload?.message || payload?.error || JSON.stringify(payload || {});
      const bodyData: Record<string, string> = {
        token: config.appToken,
        user: config.userKey,
        title: `BackupOps: ${event}`,
        message: `${summary}\n\nTime: ${new Date().toISOString()}`,
        priority: String(config.priority ?? 0),
      };
      if (config.device) {
        bodyData.device = config.device;
      }

      const res = await fetch('https://api.pushover.net/1/messages.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(bodyData).toString(),
        signal: AbortSignal.timeout(10000),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || data.status !== 1) {
        const errors = Array.isArray(data.errors) ? data.errors.join(', ') : `HTTP ${res.status}`;
        return { success: false, error: errors };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
