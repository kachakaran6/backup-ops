# BackupOps — Notifications & Alert Dispatching Architecture

## 1. Overview & Architecture

BackupOps includes an enterprise-grade notification subsystem engineered around a decoupled domain event pipeline and provider abstraction.

### Architectural Separation
```text
┌───────────────────────────┐
│ Backup Engine / Operators │
└─────────────┬─────────────┘
              │ Emits Domain Event (e.g. backup.completed)
              ▼
┌───────────────────────────┐
│   NotificationService     │  <-- Cooldown / Deduplication & Rule Matching
└─────────────┬─────────────┘
              │ Dispatches to Enabled Integrations
              ▼
┌─────────────────────────────────────────────────────────┐
│              Provider Abstraction Layer                 │
├───────────────┬─────────────────┬──────────────┬────────┤
│ SmtpProvider  │ TelegramProvider│ PushoverProv │ Gotify │
└───────────────┴─────────────────┴──────────────┴────────┘
```

The backup worker and HTTP handlers never have direct coupling to SMTP or external messaging APIs.

---

## 2. Supported Notification Providers

All providers implement the `INotificationProvider` contract:
```typescript
export interface INotificationProvider {
  readonly provider: NotificationProviderType;
  send(config: Record<string, any>, payload: NotificationMessage): Promise<NotificationSendResult>;
  test(config: Record<string, any>): Promise<NotificationTestResult>;
}
```

### 2.1 SMTP Email Provider (`smtp.provider.ts`)
- **Transport**: Implements a native, zero-dependency Node.js socket transport supporting both implicit TLS (port 465) and STARTTLS negotiation (port 587/25).
- **Configuration**:
  - `host`: SMTP server address
  - `port`: Port number (25, 465, 587)
  - `username`: SMTP auth user
  - `password`: AES-256 encrypted password
  - `encryption`: `NONE` | `STARTTLS` | `TLS`
  - `fromEmail`, `fromName`: Sender header formatting
  - `recipientEmails`: Comma-separated destination mailboxes
- **Test UX**: Transmits an immediate test email with system diagnostic details and delivery timestamp.

### 2.2 Telegram Provider (`telegram.provider.ts`)
- **Transport**: Transmits structured markdown alerts via Telegram Bot API (`https://api.telegram.org/bot<TOKEN>/sendMessage`).
- **Configuration**:
  - `botToken`: Telegram Bot Token (AES-256 encrypted)
  - `chatId`: Target Telegram Chat ID or Channel ID
- **Test UX**: Delivers a formatted test notification directly to the specified chat ID.

### 2.3 Pushover Provider (`pushover.provider.ts`)
- **Transport**: Transmits push notifications via Pushover API (`https://api.pushover.net/1/messages.json`).
- **Configuration**:
  - `applicationToken`: Pushover Application API Token (AES-256 encrypted)
  - `userKey`: Pushover User or Group Key
- **Test UX**: Triggers an instant mobile push test.

### 2.4 Gotify Provider (`gotify.provider.ts`)
- **Transport**: Integrates with self-hosted Gotify instances via `<SERVER_URL>/message`.
- **Configuration**:
  - `serverUrl`: Fully qualified Gotify server URL
  - `appToken`: Gotify Application Token (AES-256 encrypted)
- **Test UX**: Posts a real test message to the configured Gotify stream.

---

## 3. Secret Encryption & Storage Model

All provider credentials (passwords, bot tokens, API keys) are secured at rest using AES-256-GCM authenticated encryption.

### Encryption Pipeline
In `apps/api/src/modules/notification/notification.service.ts`:
1. **Key Derivation**: Uses `crypto.pbkdf2Sync(encryptionKey, 'backup-ops-salt', 100000, 32, 'sha256')`.
2. **Cipher**: Uses `crypto.createCipheriv('aes-256-gcm', key, iv)` with a cryptographically secure 16-byte random IV.
3. **Integrity Tag**: Computes and persists a 16-byte authentication tag ensuring ciphertext tampering is detected.
4. **Masked Client Preview**: When returning configuration via GET endpoints, secrets are masked (`••••••••`), and raw tokens are never emitted to the frontend or included in logs.

---

## 4. Domain Events & Alert Rules

### 4.1 Monitored System Events
- `backup.started`: Dispatched when an ad-hoc or scheduled job starts.
- `backup.completed`: Dispatched when an artifact is successfully created and verified.
- `backup.failed`: Critical alert when a backup task fails or errors out.
- `backup.verification_failed`: Dispatched if an artifact fails checksum validation.
- `backup.chain_broken`: Dispatched if an incremental lineage detects a missing parent.
- `restore.started` / `restore.completed` / `restore.failed`: Audit and operational restore alerts.
- `server.offline` / `database.unhealthy`: Infrastructure state alerts.
- `coolify.sync_failed`: Dispatched on remote integration discovery failures.

### 4.2 Deduplication & Anti-Storm Cooldown
To prevent notification storms during transient network failures or rapid retries, the dispatcher evaluates event timestamps and applies a configurable deduplication cooldown window (default 300 seconds for identical event keys).

---

## 5. Audit & Delivery History
Every outbound notification attempt creates a durable `NotificationDelivery` record:
- `event`: Domain event identifier
- `integrationId`: Target channel UUID
- `status`: `SUCCESS` | `FAILED`
- `attemptedAt`, `deliveredAt`: High-resolution timestamps
- `error`: Actionable error diagnostics if delivery failed
