import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import * as tls from 'tls';
import {
  INotificationProvider,
  NotificationSendResult,
  NotificationTestResult,
} from './notification.provider.interface';

export interface SmtpConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  encryption: 'TLS' | 'STARTTLS' | 'NONE';
  fromEmail: string;
  fromName?: string;
  recipientEmails: string[];
}

@Injectable()
export class SmtpNotificationProvider implements INotificationProvider {
  private readonly logger = new Logger(SmtpNotificationProvider.name);

  async test(config: SmtpConfig): Promise<NotificationTestResult> {
    const start = Date.now();
    try {
      if (!config.host || !config.port || !config.fromEmail) {
        return {
          success: false,
          message: 'Host, port, and fromEmail are required.',
          latencyMs: 0,
        };
      }
      const recipients = Array.isArray(config.recipientEmails)
        ? config.recipientEmails
        : [config.fromEmail];

      if (recipients.length === 0) {
        recipients.push(config.fromEmail);
      }

      await this.sendMail(
        config,
        recipients,
        'BackupOps — SMTP Connection Test',
        `Hello from BackupOps!\n\nYour SMTP configuration is working correctly.\nTimestamp: ${new Date().toISOString()}`,
      );

      return {
        success: true,
        message: `SMTP test message sent successfully to ${recipients.join(', ')}`,
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `SMTP delivery failed: ${err.message}`,
        latencyMs: Date.now() - start,
      };
    }
  }

  async send(config: SmtpConfig, event: string, payload: any): Promise<NotificationSendResult> {
    try {
      const recipients = Array.isArray(config.recipientEmails) ? config.recipientEmails : [];
      if (recipients.length === 0) {
        return { success: false, error: 'No recipient emails configured' };
      }

      const summary = payload?.message || payload?.error || JSON.stringify(payload || {});
      const subject = `[BackupOps] Alert: ${event}`;
      const body = `Event: ${event}\nTime: ${new Date().toISOString()}\n\nDetails:\n${summary}`;

      await this.sendMail(config, recipients, subject, body);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  private sendMail(
    config: SmtpConfig,
    recipients: string[],
    subject: string,
    body: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = Number(config.port) || 587;
      const host = config.host;
      const encryption = config.encryption || (port === 465 ? 'TLS' : 'STARTTLS');

      let socket: net.Socket | tls.TLSSocket;
      let buffer = '';
      let currentResolve: ((res: string) => void) | null = null;
      let currentReject: ((err: Error) => void) | null = null;
      let isClosed = false;

      const timer = setTimeout(() => {
        cleanup(new Error(`SMTP connection timed out to ${host}:${port}`));
      }, 15000);

      const cleanup = (err?: Error) => {
        if (isClosed) return;
        isClosed = true;
        clearTimeout(timer);
        try {
          socket?.destroy();
        } catch (_) {}
        if (err) {
          if (currentReject) currentReject(err);
          reject(err);
        }
      };

      const setupListeners = (s: net.Socket | tls.TLSSocket) => {
        s.on('data', (chunk) => {
          buffer += chunk.toString('utf-8');
          const lines = buffer.split('\r\n');
          // If the last line is complete
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i];
            // Multi-line responses have '-' after the 3-digit code e.g. 250-xyz
            if (/^\d{3}\s/.test(line)) {
              const fullResponse = buffer;
              buffer = lines.slice(i + 1).join('\r\n');
              if (currentResolve) {
                const resolveFn = currentResolve;
                currentResolve = null;
                currentReject = null;
                resolveFn(fullResponse);
              }
              break;
            }
          }
        });

        s.on('error', (err) => cleanup(err));
        s.on('close', () => {
          if (!isClosed && currentReject) {
            cleanup(new Error('Connection closed by remote SMTP server'));
          }
        });
      };

      const waitForResponse = (expectedPrefix?: string): Promise<string> => {
        return new Promise((res, rej) => {
          currentResolve = (response: string) => {
            if (expectedPrefix && !response.startsWith(expectedPrefix)) {
              rej(new Error(`SMTP error: Expected ${expectedPrefix}, got: ${response.trim()}`));
            } else {
              res(response);
            }
          };
          currentReject = rej;
        });
      };

      const write = (cmd: string) => {
        return new Promise<void>((res, rej) => {
          socket.write(cmd + '\r\n', 'utf-8', (err) => {
            if (err) rej(err);
            else res();
          });
        });
      };

      const run = async () => {
        try {
          if (encryption === 'TLS' || port === 465) {
            socket = tls.connect({
              host,
              port,
              rejectUnauthorized: false,
            });
            setupListeners(socket);
            await waitForResponse('220');
          } else {
            socket = net.connect({ host, port });
            setupListeners(socket);
            await waitForResponse('220');

            if (encryption === 'STARTTLS') {
              await write('EHLO backup-ops.local');
              await waitForResponse('250');
              await write('STARTTLS');
              await waitForResponse('220');

              // Upgrade socket to TLS
              const rawSocket = socket;
              await new Promise<void>((upgradeRes, upgradeRej) => {
                const tlsSocket = tls.connect({
                  socket: rawSocket,
                  host,
                  rejectUnauthorized: false,
                });
                tlsSocket.on('secureConnect', () => {
                  socket = tlsSocket;
                  setupListeners(socket);
                  upgradeRes();
                });
                tlsSocket.on('error', (err) => upgradeRej(err));
              });
            }
          }

          // Say EHLO
          await write('EHLO backup-ops.local');
          await waitForResponse('250');

          // Authenticate if credentials provided
          if (config.username && config.password) {
            await write('AUTH LOGIN');
            await waitForResponse('334');
            await write(Buffer.from(config.username).toString('base64'));
            await waitForResponse('334');
            await write(Buffer.from(config.password).toString('base64'));
            await waitForResponse('235');
          }

          // MAIL FROM
          await write(`MAIL FROM:<${config.fromEmail}>`);
          await waitForResponse('250');

          // RCPT TO
          for (const recipient of recipients) {
            await write(`RCPT TO:<${recipient}>`);
            await waitForResponse('250');
          }

          // DATA
          await write('DATA');
          await waitForResponse('354');

          const fromHeader = config.fromName
            ? `"${config.fromName}" <${config.fromEmail}>`
            : config.fromEmail;
          const toHeader = recipients.join(', ');
          const dateHeader = new Date().toUTCString();

          const mailHeaders = [
            `From: ${fromHeader}`,
            `To: ${toHeader}`,
            `Subject: ${subject}`,
            `Date: ${dateHeader}`,
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=utf-8',
            'X-Mailer: BackupOps Control Plane',
          ].join('\r\n');

          const fullMessage = `${mailHeaders}\r\n\r\n${body}\r\n.\r\n`;
          await write(fullMessage);
          await waitForResponse('250');

          // QUIT
          await write('QUIT');
          cleanup();
          resolve();
        } catch (err: any) {
          cleanup(err);
        }
      };

      run();
    });
  }
}
