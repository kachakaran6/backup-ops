import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationProvider,
  NotificationSendResult,
  NotificationTestResult,
} from './notification.provider.interface';

export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

@Injectable()
export class TelegramNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(TelegramNotificationProvider.name);

  async test(config: TelegramConfig): Promise<NotificationTestResult> {
    const start = Date.now();
    try {
      if (!config.botToken || !config.chatId) {
        return {
          success: false,
          message: 'Bot Token and Chat ID are required.',
          latencyMs: 0,
        };
      }

      const text = `🔔 *BackupOps Notification Integration*\n\nConnection verified successfully.\nTimestamp: \`${new Date().toISOString()}\``;
      const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          text,
          parse_mode: 'Markdown',
        }),
        signal: AbortSignal.timeout(10000),
      });

      const latencyMs = Date.now() - start;
      const data = (await res.json().catch(() => ({}))) as any;

      if (!res.ok || !data.ok) {
        const errorDesc = data.description || `HTTP ${res.status}`;
        return {
          success: false,
          message: `Telegram delivery failed: ${errorDesc}`,
          latencyMs,
        };
      }

      return {
        success: true,
        message: 'Telegram test message delivered successfully.',
        latencyMs,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Telegram connection error: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  async send(config: TelegramConfig, event: string, payload: any): Promise<NotificationSendResult> {
    try {
      const summary = payload?.message || payload?.error || JSON.stringify(payload || {});
      const text = `🚨 *BackupOps Alert: ${event}*\n\n${summary}\n\nTime: \`${new Date().toISOString()}\``;

      const res = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          text,
          parse_mode: 'Markdown',
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = (await res.json().catch(() => ({}))) as any;
      if (!res.ok || !data.ok) {
        return { success: false, error: data.description || `HTTP ${res.status}` };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
