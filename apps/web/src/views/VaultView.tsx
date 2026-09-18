import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Lock,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  X,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Credential } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { FilterBar } from '../components/common/FilterBar';

export const VaultView: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  // New Credential Form
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<string>('SSH_KEY');
  const [secretValue, setSecretValue] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const data = await api.fetchCredentials();
      setCredentials(data);
    } catch (err) {
      console.error('Failed to load credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !secretValue) return;

    setSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await api.createCredential({
        name,
        type,
        data: { secret: secretValue },
      });

      if (res) {
        setStatusMessage({ type: 'success', text: 'Credential successfully encrypted with AES-256-GCM and stored in vault.' });
        setName('');
        setSecretValue('');
        setShowAddModal(false);
        await loadCredentials();
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to store credential. Please try again.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving credential.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Permanently remove this encrypted credential from the vault? Workloads using it may lose access.')) {
      await api.removeCredential(id);
      loadCredentials();
    }
  };

  const filteredCredentials = useMemo(() => {
    return credentials.filter((c) => {
      return search === '' || c.name.toLowerCase().includes(search.toLowerCase()) || c.type.toLowerCase().includes(search.toLowerCase());
    });
  }, [credentials, search]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-text-primary tracking-tight">
              Cryptographic Credential Vault
            </h1>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-secondary border border-border text-text-muted">
              {credentials.length} secrets
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Zero-knowledge secret management. SSH private keys, database passwords, and Coolify tokens are AES-256-GCM encrypted.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadCredentials}
            disabled={loading}
            className="op-btn-secondary"
            title="Refresh Vault"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-primary' : 'text-text-muted'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="op-btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Store Secret</span>
          </button>
        </div>
      </div>

      {/* Security Notice */}
      <div className="op-card p-3.5 flex items-start gap-3 border-l-2 border-l-brand-primary">
        <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <span className="font-semibold text-text-primary">
            Zero-Leak Cryptographic Safety Guarantee
          </span>
          <p className="text-text-muted leading-relaxed text-[11px]">
            Plaintext secrets are never logged, never cached in browser storage, and never returned in API query responses.
            Decryption is strictly confined to in-memory worker buffers at runtime when initiating secure SSH sockets,
            PostgreSQL connections, or AWS S3 signed requests.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-success/10 text-success border border-success/30'
              : 'bg-error/10 text-error border border-error/30'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filter Bar */}
      {credentials.length > 0 && (
        <FilterBar
          searchPlaceholder="Search credentials by label or type..."
          searchValue={search}
          onSearchChange={setSearch}
          totalCount={credentials.length}
          filteredCount={filteredCredentials.length}
        />
      )}

      {/* Credentials Grid */}
      {credentials.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="No encrypted credentials in vault"
          description="Securely register SSH private keys, Coolify API tokens, database passwords, or S3 access keys."
          actionText="Add First Credential"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCredentials.map((cred) => (
            <div key={cred.id} className="op-card p-4 space-y-3 flex flex-col justify-between hover:border-border-strong transition-colors">
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded bg-surface-secondary border border-border flex items-center justify-center shrink-0 text-brand-primary">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-xs text-text-primary truncate">{cred.name}</h3>
                      <p className="text-[10px] text-text-muted font-mono truncate">ID: {cred.id.slice(0, 16)}...</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-text-muted shrink-0">
                    AES-256-GCM
                  </span>
                </div>

                <div className="p-2 rounded bg-surface-secondary border border-border font-mono text-[11px] text-text-muted flex items-center justify-between">
                  <span>Type: <strong className="text-text-primary">{cred.type}</strong></span>
                  <span className="flex items-center gap-1 text-text-muted">
                    <EyeOff className="w-3 h-3" /> Sealed
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[11px] text-text-muted">
                <span className="font-mono text-[10px]">Created {new Date(cred.createdAt).toLocaleDateString()}</span>
                <button
                  onClick={() => handleDelete(cred.id)}
                  className="op-btn-ghost !p-1 text-text-muted hover:text-error"
                  title="Remove Credential"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Encrypted Credential */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md op-card-elevated p-5 shadow-2xl space-y-4 border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-primary" />
                <h3 className="font-semibold text-sm text-text-primary">Store Encrypted Credential</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCredential} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-text-secondary mb-1 font-medium">Credential Label / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Production DB Password or Bastion SSH Key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="op-input"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary mb-1 font-medium">Credential Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="op-input font-sans"
                >
                  <option value="SSH_KEY">SSH Private Key (PEM / OpenSSH)</option>
                  <option value="DATABASE_PASSWORD">Database Password</option>
                  <option value="API_TOKEN">API Token (e.g. Coolify / Webhook)</option>
                  <option value="S3_SECRET">S3 Secret Key</option>
                </select>
              </div>

              <div>
                <label className="block text-text-secondary mb-1 font-medium">Secret Payload (Plaintext)</label>
                <textarea
                  rows={type === 'SSH_KEY' ? 5 : 3}
                  placeholder={
                    type === 'SSH_KEY'
                      ? '-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----'
                      : 'Enter secret password or token...'
                  }
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  className="op-input font-mono text-[11px]"
                  required
                />
                <p className="text-[10px] text-text-muted mt-1 font-mono">
                  Transmitted over TLS and encrypted immediately with server-side AES-256-GCM cipher before writing to PostgreSQL.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="op-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="op-btn-primary"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Encrypting...' : 'Encrypt & Store'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
