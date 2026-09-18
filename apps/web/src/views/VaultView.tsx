import React, { useState, useEffect } from 'react';
import {
  Key,
  Lock,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCode,
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-400" />
            Encrypted Credential Vault
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Zero-knowledge secret management. SSH private keys, database passwords, and Coolify tokens are AES-256-GCM encrypted.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Encrypted Credential</span>
        </button>
      </div>

      {/* Security Notice */}
      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-semibold text-emerald-300">
            Cryptographic Safety Guarantee (Zero-Leak Policy)
          </span>
          <p className="text-zinc-400 leading-relaxed">
            Plaintext secrets are never logged, never cached in browser localStorage, and never returned in API responses.
            Decryption is strictly confined to in-memory worker buffers at runtime when initiating secure SSH sockets,
            PostgreSQL connections, or AWS S3 signed requests.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {credentials.map((cred) => (
            <div key={cred.id} className="p-5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-blue-400">
                    <Lock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-100">{cred.name}</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">ID: {cred.id.slice(0, 16)}...</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  AES-256-GCM
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 font-mono text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Type: <strong className="text-zinc-200">{cred.type}</strong></span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <EyeOff className="w-3 h-3" /> Encrypted At Rest
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                <span>Created {new Date(cred.createdAt).toLocaleDateString()}</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Ready for Operations
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Encrypted Credential */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm text-zinc-100">Store Encrypted Credential</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCredential} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Credential Label / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Production DB Password or Bastion SSH Key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Credential Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="SSH_KEY">SSH Private Key (PEM / OpenSSH)</option>
                  <option value="DATABASE_PASSWORD">Database Password</option>
                  <option value="API_TOKEN">API Token (e.g. Coolify / Webhook)</option>
                  <option value="S3_SECRET">S3 Secret Key</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-medium">Secret Payload (Plaintext)</label>
                <textarea
                  rows={type === 'SSH_KEY' ? 5 : 3}
                  placeholder={
                    type === 'SSH_KEY'
                      ? '-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----'
                      : 'Enter secret password or token...'
                  }
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 font-mono text-[11px] focus:outline-none focus:border-blue-500"
                  required
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Transmitted over TLS and encrypted immediately with server-side AES-256-GCM cipher before writing to PostgreSQL.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm"
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
