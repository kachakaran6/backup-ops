import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Send,
  Smartphone,
  Server,
  Plus,
  Clock,
  Play,
  Trash2,
  Edit2,
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  NotificationIntegration,
  NotificationRule,
  NotificationDelivery,
} from '../types';
import { api } from '../services/api';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { EmptyState } from '../components/common/EmptyState';

export const NotificationsView: React.FC = () => {
  const [integrations, setIntegrations] = useState<NotificationIntegration[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<NotificationIntegration | null>(null);
  const [providerType, setProviderType] = useState<'smtp' | 'telegram' | 'pushover' | 'gotify'>('telegram');
  const [name, setName] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  const [showSecrets, setShowSecrets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [intData, rulesData, delData] = await Promise.all([
        api.notifications.listIntegrations(),
        api.notifications.listRules(),
        api.notifications.listDeliveries(),
      ]);
      setIntegrations(intData);
      setRules(rulesData);
      setDeliveries(delData);
    } catch (err: any) {
      console.error('Failed to load notifications data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = (provider: 'smtp' | 'telegram' | 'pushover' | 'gotify') => {
    setEditingIntegration(null);
    setProviderType(provider);
    setName(`${provider.toUpperCase()} Channel`);
    setConfig(
      provider === 'smtp'
        ? { host: '', port: 587, username: '', password: '', encryption: 'STARTTLS', fromEmail: '', fromName: 'BackupOps', recipientEmails: '' }
        : provider === 'telegram'
        ? { botToken: '', chatId: '' }
        : provider === 'pushover'
        ? { appToken: '', userKey: '' }
        : { serverUrl: 'https://gotify.yourdomain.com', appToken: '', priority: 5 }
    );
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (item: NotificationIntegration) => {
    setEditingIntegration(item);
    setProviderType(item.provider);
    setName(item.name);
    setConfig({
      ...item.config,
      recipientEmails: Array.isArray(item.config?.recipientEmails)
        ? item.config.recipientEmails.join(', ')
        : item.config?.recipientEmails || '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const payloadConfig = { ...config };
      if (providerType === 'smtp' && typeof payloadConfig.recipientEmails === 'string') {
        payloadConfig.recipientEmails = payloadConfig.recipientEmails
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      await api.notifications.saveIntegration({
        id: editingIntegration?.id,
        provider: providerType,
        name,
        config: payloadConfig,
        enabled: editingIntegration ? editingIntegration.enabled : true,
      });

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this notification channel? Alerts routed to it will no longer be dispatched.')) return;
    try {
      await api.notifications.deleteIntegration(id);
      await loadData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await api.notifications.testIntegration(id);
      setTestResult({ id, success: res.success, message: res.message });
      await loadData();
    } catch (err: any) {
      setTestResult({ id, success: false, message: err.message || 'Connection test failed' });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleRule = async (rule: NotificationRule) => {
    try {
      await api.notifications.updateRule(rule.event, {
        enabled: !rule.enabled,
        integrationIds: rule.integrationIds,
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
      );
    } catch (err: any) {
      alert(`Update rule failed: ${err.message}`);
    }
  };

  const handleToggleRuleIntegration = async (rule: NotificationRule, integrationId: string) => {
    const current = rule.integrationIds || [];
    const next = current.includes(integrationId)
      ? current.filter((id) => id !== integrationId)
      : [...current, integrationId];

    try {
      await api.notifications.updateRule(rule.event, {
        enabled: rule.enabled,
        integrationIds: next,
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, integrationIds: next } : r))
      );
    } catch (err: any) {
      alert(`Update failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-end pb-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openCreateModal('telegram')}
            className="op-btn-secondary"
          >
            <Send className="w-3.5 h-3.5 text-text-muted" />
            Add Telegram
          </button>
          <button
            onClick={() => openCreateModal('smtp')}
            className="op-btn-secondary"
          >
            <Mail className="w-3.5 h-3.5 text-text-muted" />
            Add SMTP Email
          </button>
          <button
            onClick={() => openCreateModal('gotify')}
            className="op-btn-secondary"
          >
            <Server className="w-3.5 h-3.5 text-text-muted" />
            Add Gotify
          </button>
          <button
            onClick={() => openCreateModal('pushover')}
            className="op-btn-secondary"
          >
            <Smartphone className="w-3.5 h-3.5 text-text-muted" />
            Add Pushover
          </button>
        </div>
      </div>

      {/* Configured Integrations Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-medium text-text-muted uppercase tracking-wider">
            Connected Notification Channels ({integrations.length})
          </h3>
          <button
            onClick={loadData}
            disabled={loading}
            className="op-btn-ghost text-xs py-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {integrations.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notification channels configured"
            description="Add Telegram, SMTP Email, Gotify, or Pushover to receive incident notifications on failed backups, verification mismatches, and offline hosts."
            actionText="Add Telegram Channel"
            onAction={() => openCreateModal('telegram')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {integrations.map((item) => {
              const isTesting = testingId === item.id;

              return (
                <div
                  key={item.id}
                  className="op-card p-4 flex flex-col justify-between hover:border-border-strong transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded bg-surface-secondary text-text-secondary border border-border">
                          {item.provider === 'telegram' && <Send className="w-4 h-4 text-text-muted" />}
                          {item.provider === 'smtp' && <Mail className="w-4 h-4 text-text-muted" />}
                          {item.provider === 'gotify' && <Server className="w-4 h-4 text-text-muted" />}
                          {item.provider === 'pushover' && <Smartphone className="w-4 h-4 text-text-muted" />}
                        </div>
                        <div>
                          <div className="font-medium text-text-primary text-xs">{item.name}</div>
                          <div className="text-[11px] uppercase font-mono text-text-muted">
                            {item.provider}
                          </div>
                        </div>
                      </div>

                      <StatusIndicator status={item.status} variant="badge" />
                    </div>

                    {/* Metadata Preview */}
                    <div className="space-y-1 text-xs text-text-secondary bg-surface-secondary/70 p-2.5 rounded border border-border-subtle font-mono">
                      {item.provider === 'telegram' && (
                        <div>Chat ID: <span className="text-text-primary">{item.config?.chatId || 'Not set'}</span></div>
                      )}
                      {item.provider === 'smtp' && (
                        <>
                          <div>Host: <span className="text-text-primary">{item.config?.host}:{item.config?.port}</span></div>
                          <div>From: <span className="text-text-primary">{item.config?.fromEmail}</span></div>
                        </>
                      )}
                      {item.provider === 'gotify' && (
                        <div>Server: <span className="text-text-primary">{item.config?.serverUrl}</span></div>
                      )}
                      {item.provider === 'pushover' && (
                        <div>User: <span className="text-text-primary">{item.config?.userKey ? 'Configured' : 'Not set'}</span></div>
                      )}
                      <div className="text-[10px] text-text-muted flex items-center gap-1 pt-1 border-t border-border-subtle">
                        <Shield className="w-3 h-3 text-success" />
                        AES-256 encrypted credentials
                      </div>
                    </div>

                    {/* Error / Last test */}
                    {item.lastError && (
                      <div className="mt-2 text-[11px] text-error bg-error-muted p-2 rounded border border-error/20 font-mono">
                        {item.lastError}
                      </div>
                    )}
                    {testResult && testResult.id === item.id && (
                      <div
                        className={`mt-2 text-[11px] p-2 rounded border font-mono ${
                          testResult.success
                            ? 'text-success bg-success-muted border-success/30'
                            : 'text-error bg-error-muted border-error/30'
                        }`}
                      >
                        {testResult.message}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-border">
                    <button
                      onClick={() => handleTest(item.id)}
                      disabled={isTesting}
                      className="op-btn-secondary text-xs py-1 px-2.5"
                    >
                      <Play className={`w-3 h-3 text-text-muted ${isTesting ? 'animate-spin' : ''}`} />
                      {isTesting ? 'Testing...' : 'Test Channel'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-secondary rounded"
                        title="Edit Integration"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-text-muted hover:text-error hover:bg-error-muted rounded"
                        title="Delete Integration"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Incident Dispatch Rules */}
      <div className="op-card p-4 sm:p-5">
        <h3 className="text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-1">
          Domain Event Notification Rules & Routing
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Select which alert channels receive notifications for specific backup and infrastructure events.
        </p>

        <div className="divide-y divide-border">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleRule(rule)}
                  className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {rule.enabled ? (
                    <ToggleRight className="w-6 h-6 text-accent" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-text-muted" />
                  )}
                </button>
                <div>
                  <span className="font-mono text-xs font-medium text-text-primary">
                    {rule.event}
                  </span>
                  <span className="ml-2 text-[11px] text-text-muted font-mono">
                    cooldown: {rule.cooldownMinutes}m
                  </span>
                </div>
              </div>

              {/* Target Channel Pills */}
              <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                {integrations.length === 0 ? (
                  <span className="text-xs text-text-muted italic">No channels configured</span>
                ) : (
                  integrations.map((int) => {
                    const isSelected = rule.integrationIds?.includes(int.id);
                    return (
                      <button
                        key={int.id}
                        onClick={() => handleToggleRuleIntegration(rule, int.id)}
                        className={`text-xs px-2.5 py-1 rounded border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-accent-muted border-accent text-accent font-medium'
                            : 'bg-surface-secondary border-border text-text-muted hover:text-text-secondary'
                        }`}
                      >
                        {int.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Notification Deliveries History */}
      <div className="op-card p-4 sm:p-5">
        <h3 className="text-xs font-mono font-medium text-text-muted uppercase tracking-wider mb-1">
          Recent Notification Delivery Log
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Audit trail of attempted and delivered incident messages across all channels.
        </p>

        {deliveries.length === 0 ? (
          <div className="text-xs text-text-muted py-6 text-center italic font-mono">
            No delivery events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Payload / Error Summary</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((del) => (
                  <tr key={del.id}>
                    <td className="whitespace-nowrap font-mono text-text-muted">
                      {new Date(del.attemptedAt).toLocaleString()}
                    </td>
                    <td className="font-mono text-text-primary">{del.event}</td>
                    <td className="whitespace-nowrap">
                      <StatusIndicator
                        status={del.status === 'success' ? 'completed' : 'failed'}
                        label={del.status.toUpperCase()}
                        variant="inline"
                      />
                    </td>
                    <td className="text-text-secondary truncate max-w-md">
                      {del.error ? (
                        <span className="text-error font-mono">{del.error}</span>
                      ) : (
                        <span className="font-mono text-text-secondary">{del.payloadSummary || 'Delivered'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Integration Configure / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="op-card-elevated shadow-2xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              {editingIntegration ? 'Edit Notification Channel' : `Configure ${providerType.toUpperCase()} Channel`}
            </h3>
            <p className="text-xs text-text-muted mb-4">
              All credentials and API tokens are encrypted with AES-256-GCM before database storage.
            </p>

            {formError && (
              <div className="op-alert-error mb-4 text-xs font-mono">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-text-secondary mb-1">Channel Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="op-input"
                  placeholder="e.g. Production Ops Telegram"
                />
              </div>

              {/* Provider Specific Inputs */}
              {providerType === 'telegram' && (
                <>
                  <div>
                    <label className="block text-text-secondary mb-1">Telegram Bot Token</label>
                    <div className="relative">
                      <input
                        type={showSecrets ? 'text' : 'password'}
                        required
                        value={config.botToken || ''}
                        onChange={(e) => setConfig({ ...config, botToken: e.target.value })}
                        className="op-input pr-8 font-mono"
                        placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecrets(!showSecrets)}
                        className="absolute right-2 top-2 text-text-muted hover:text-text-primary cursor-pointer"
                      >
                        {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-text-secondary mb-1">Chat ID / Group ID</label>
                    <input
                      type="text"
                      required
                      value={config.chatId || ''}
                      onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
                      className="op-input font-mono"
                      placeholder="e.g. -100123456789 or 98765432"
                    />
                  </div>
                </>
              )}

              {providerType === 'smtp' && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-text-secondary mb-1">SMTP Host</label>
                      <input
                        type="text"
                        required
                        value={config.host || ''}
                        onChange={(e) => setConfig({ ...config, host: e.target.value })}
                        className="op-input font-mono"
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-1">Port</label>
                      <input
                        type="number"
                        required
                        value={config.port || 587}
                        onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })}
                        className="op-input font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-text-secondary mb-1">Username (optional)</label>
                      <input
                        type="text"
                        value={config.username || ''}
                        onChange={(e) => setConfig({ ...config, username: e.target.value })}
                        className="op-input font-mono"
                        placeholder="alerts@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-1">Password (optional)</label>
                      <input
                        type={showSecrets ? 'text' : 'password'}
                        value={config.password || ''}
                        onChange={(e) => setConfig({ ...config, password: e.target.value })}
                        className="op-input font-mono"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-text-secondary mb-1">Encryption</label>
                      <select
                        value={config.encryption || 'STARTTLS'}
                        onChange={(e) => setConfig({ ...config, encryption: e.target.value })}
                        className="op-input"
                      >
                        <option value="STARTTLS">STARTTLS (Port 587)</option>
                        <option value="TLS">Implicit TLS (Port 465)</option>
                        <option value="NONE">Plain / None (Port 25)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-text-secondary mb-1">Sender Name</label>
                      <input
                        type="text"
                        value={config.fromName || 'BackupOps'}
                        onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                        className="op-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-text-secondary mb-1">From Email</label>
                    <input
                      type="email"
                      required
                      value={config.fromEmail || ''}
                      onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                      className="op-input font-mono"
                      placeholder="alerts@yourdomain.com"
                    />
                  </div>

                  <div>
                    <label className="block text-text-secondary mb-1">Recipient Email(s) (comma-separated)</label>
                    <input
                      type="text"
                      required
                      value={config.recipientEmails || ''}
                      onChange={(e) => setConfig({ ...config, recipientEmails: e.target.value })}
                      className="op-input font-mono"
                      placeholder="oncall@company.com, devops@company.com"
                    />
                  </div>
                </>
              )}

              {providerType === 'gotify' && (
                <>
                  <div>
                    <label className="block text-text-secondary mb-1">Gotify Server URL</label>
                    <input
                      type="url"
                      required
                      value={config.serverUrl || ''}
                      onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })}
                      className="op-input font-mono"
                      placeholder="https://gotify.yourdomain.com"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary mb-1">Application Token</label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      required
                      value={config.appToken || ''}
                      onChange={(e) => setConfig({ ...config, appToken: e.target.value })}
                      className="op-input font-mono"
                      placeholder="A1b2C3d4E5f6G7"
                    />
                  </div>
                </>
              )}

              {providerType === 'pushover' && (
                <>
                  <div>
                    <label className="block text-text-secondary mb-1">Pushover Application Token</label>
                    <input
                      type={showSecrets ? 'text' : 'password'}
                      required
                      value={config.appToken || ''}
                      onChange={(e) => setConfig({ ...config, appToken: e.target.value })}
                      className="op-input font-mono"
                      placeholder="azGDORePK8gMaC0QOYAMyEEuzJnyUi"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary mb-1">User Key</label>
                    <input
                      type="text"
                      required
                      value={config.userKey || ''}
                      onChange={(e) => setConfig({ ...config, userKey: e.target.value })}
                      className="op-input font-mono"
                      placeholder="uQiRzpo4DXghDmr9Qnox015xxxxxx"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="op-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="op-btn-primary"
                >
                  {saving ? 'Saving...' : editingIntegration ? 'Update Channel' : 'Save Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
