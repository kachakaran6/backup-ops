import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationProvider,
  NotificationSendResult,
  NotificationTestResult,
} from './notification.provider.interface';

export interface GotifyConfig {
  serverUrl: string;
  appToken: string;
  priority?: number;
}

@Injectable()
export class GotifyNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(GotifyNotificationProvider.name);

  async test(config: GotifyConfig): Promise<NotificationTestResult> {
    const start = Date.now();
    try {
      if (!config.serverUrl || !config.appToken) {
        return {
          success: false,
          message: 'Server URL and Application Token are required.',
          latencyMs: 0,
        };
      }

      const baseUrl = config.serverUrl.replace(/\/+$/, '');
      const url = `${baseUrl}/message`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gotify-Key': config.appToken,
        },
        body: JSON.stringify({
          title: 'BackupOps Notification Integration',
          message: `Connection to Gotify instance verified successfully.\nTimestamp: ${new Date().toISOString()}`,
          priority: config.priority ?? 5,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const latencyMs = Date.now() - start;
      const data = (await res.json().catch(() => ({}))) as any;

      if (!res.ok) {
        const errorDesc = data.errorDescription || data.error || `HTTP ${res.status}`;
        return {
          success: false,
          message: `Gotify delivery failed: ${errorDesc}`,
          latencyMs,
        };
      }

      return {
        success: true,
        message: 'Gotify test message delivered successfully.',
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Gotify connection error: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  async send(config: GotifyConfig, event: string, payload: any): Promise<NotificationSendResult> {
    try {
      const baseUrl = config.serverUrl.replace(/\/+$/, '');
      const url = `${baseUrl}/message`;
      const summary = payload?.message || payload?.error || JSON.stringify(payload || {});

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Gotify-Key': config.appToken,
        },
        body: JSON.stringify({
          title: `BackupOps: ${event}`,
          message: `${summary}\n\nTime: ${new Date().toISOString()}`,
          priority: config.priority ?? 5,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok) {
        return {
          success: false,
          error: data.errorDescription || data.error || `HTTP ${res.status}`,
        };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
