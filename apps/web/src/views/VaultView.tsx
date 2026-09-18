import React, { useState, useEffect } from 'react';
import {
  Key,
  Lock,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  EyeOff,
  X,
} from 'lucide-react';
import { Credential } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';

export const VaultView: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Credential Form
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<string>('SSH_KEY');
  const [secretValue, setSecretValue] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCredentials = async () => {
    setLoading(true);
    const data = await api.fetchCredentials();
    setCredentials(data);
    setLoading(false);
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
      const res = await fetch('/api/v1/credentials?organizationId=default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          type,
          data: { secret: secretValue },
        }),
      });

      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Credential successfully encrypted with AES-256-GCM and stored.' });
        setName('');
        setSecretValue('');
        setShowAddModal(false);
        await loadCredentials();
      } else {
        setStatusMessage({ type: 'error', text: 'Failed to store credential.' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving credential.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
            <Key className="w-4 h-4 text-text-muted" />
            Encrypted Credential Vault
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Zero-knowledge secret management. SSH private keys, database passwords, and Coolify tokens are AES-256-GCM encrypted.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="op-btn-primary self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Encrypted Credential</span>
        </button>
      </div>

      {/* Security Notice */}
      <div className="op-card p-4 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-semibold text-text-primary">
            Cryptographic Safety Guarantee (Zero-Leak Policy)
          </span>
          <p className="text-text-muted leading-relaxed">
            Plaintext secrets are never logged, never cached in browser localStorage, and never returned in API responses.
            Decryption is strictly confined to in-memory worker buffers at runtime when initiating secure SSH sockets,
            PostgreSQL connections, or AWS S3 signed requests.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-md text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'op-alert-success'
              : 'op-alert-error'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Credentials Grid */}
      {credentials.length === 0 ? (
        <EmptyState
          icon={Lock}
          title="No Stored Credentials"
          description="Securely register SSH private keys, Coolify API tokens, database passwords, or S3 access keys."
          actionText="Add First Credential"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {credentials.map((cred) => (
            <div key={cred.id} className="op-card p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-md bg-surface-secondary border border-border text-text-muted shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xs text-text-primary truncate">{cred.name}</h3>
                    <p className="text-[10px] text-text-muted font-mono">ID: {cred.id.slice(0, 16)}...</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface-secondary text-text-muted border border-border shrink-0">
                  AES-256-GCM
                </span>
              </div>

              <div className="p-2 rounded-md bg-surface-secondary border border-border font-mono text-[11px] text-text-muted flex items-center justify-between">
                <span>Type: <strong className="text-text-secondary">{cred.type}</strong></span>
                <span className="flex items-center gap-1">
                  <EyeOff className="w-3 h-3" /> Encrypted
                </span>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-border-subtle text-[11px] text-text-muted">
                <span>Created {new Date(cred.createdAt).toLocaleDateString()}</span>
                <span className="text-success font-medium flex items-center gap-1 font-mono text-[10px]">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Encrypted Credential */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md op-card-elevated p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-text-muted" />
                <h3 className="font-semibold text-xs text-text-primary">Store Encrypted Credential</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
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
                  className="op-input"
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
                <p className="text-[10px] text-text-muted mt-1">
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
