import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useControlPlane } from '../context/ControlPlaneContext';
import { useTheme } from '../context/ThemeContext';
import {
  Settings,
  User,
  Shield,
  Server,
  Database,
  Layers,
  Key,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Sliders,
  Sun,
  Moon,
  Monitor,
  Check,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, logout } = useAuth();
  const { servers, databases, backups, refresh, isRefreshing } = useControlPlane();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleClearCache = () => {
    sessionStorage.clear();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-surface-secondary border border-border text-brand-primary">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-text-primary tracking-tight">
              Control Plane Settings &amp; Preferences
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Operator identity, theme appearance, cryptographic vault status, and runtime diagnostics.
            </p>
          </div>
        </div>

        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="op-btn-secondary self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-primary' : 'text-text-muted'}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Theme Appearance Mode Card */}
      <div className="op-card p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="space-y-0.5">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
              Console Appearance &amp; Contrast Mode
            </h2>
            <p className="text-[11px] text-text-muted">
              Select your interface theme. Both modes are built with high-density infrastructure tokens.
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-secondary border border-border text-text-muted">
            Active: {resolvedTheme}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-lg border text-left flex items-start justify-between transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-brand-primary bg-brand-primary/10 text-text-primary ring-1 ring-brand-primary'
                : 'border-border bg-surface-secondary text-text-muted hover:border-border-strong hover:text-text-primary'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-brand-primary" />
                <span className="text-xs font-semibold text-text-primary">Dark Operational</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Deep Charcoal (#1E1E2C) foundation tuned for low eye fatigue in SOC &amp; SRE setups.
              </p>
            </div>
            {theme === 'dark' && <Check className="w-4 h-4 text-brand-primary shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3 rounded-lg border text-left flex items-start justify-between transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-brand-primary bg-brand-primary/10 text-text-primary ring-1 ring-brand-primary'
                : 'border-border bg-surface-secondary text-text-muted hover:border-border-strong hover:text-text-primary'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-brand-primary" />
                <span className="text-xs font-semibold text-text-primary">Light Operational</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Soft neutral background with clear borders and Borg-inspired operational clarity.
              </p>
            </div>
            {theme === 'light' && <Check className="w-4 h-4 text-brand-primary shrink-0" />}
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-3 rounded-lg border text-left flex items-start justify-between transition-all cursor-pointer ${
              theme === 'system'
                ? 'border-brand-primary bg-brand-primary/10 text-text-primary ring-1 ring-brand-primary'
                : 'border-border bg-surface-secondary text-text-muted hover:border-border-strong hover:text-text-primary'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-brand-primary" />
                <span className="text-xs font-semibold text-text-primary">System Adaptive</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Automatically matches your operating system preference via CSS media queries.
              </p>
            </div>
            {theme === 'system' && <Check className="w-4 h-4 text-brand-primary shrink-0" />}
          </button>
        </div>
      </div>

      {/* Operator Account Section */}
      <div className="op-card p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-border">
          <User className="w-4 h-4 text-brand-primary" />
          <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
            Active Operator Session
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="bg-surface-secondary p-2.5 rounded border border-border">
            <div className="text-text-muted mb-1 text-[10px] uppercase">Authenticated Email</div>
            <div className="font-semibold text-text-primary truncate">{user?.email || 'admin@gmail.com'}</div>
          </div>
          <div className="bg-surface-secondary p-2.5 rounded border border-border">
            <div className="text-text-muted mb-1 text-[10px] uppercase">Username / ID</div>
            <div className="font-semibold text-text-primary truncate">{user?.username || 'admin'}</div>
          </div>
          <div className="bg-surface-secondary p-2.5 rounded border border-border">
            <div className="text-text-muted mb-1 text-[10px] uppercase">Access Role</div>
            <div className="inline-flex items-center gap-1 text-success font-medium">
              <Shield className="w-3 h-3" />
              <span>{user?.role?.toUpperCase() || 'SUPER_ADMIN'}</span>
            </div>
          </div>
          <div className="bg-surface-secondary p-2.5 rounded border border-border">
            <div className="text-text-muted mb-1 text-[10px] uppercase">Workspace Org</div>
            <div className="text-text-secondary truncate">{user?.organizationId || 'default'}</div>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>Session protected by cryptographic JWT bearer tokens with automatic renewal.</span>
          </div>
          <button
            onClick={logout}
            className="op-btn-danger self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </div>

      {/* Platform & Runtime Diagnostics */}
      <div className="op-card p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-border">
          <Layers className="w-4 h-4 text-brand-primary" />
          <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
            Control Plane Architecture &amp; Health
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded bg-surface-secondary border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-brand-primary" />
                Infrastructure Registry
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface text-text-muted font-mono text-[10px] border border-border">
                {servers.length} Hosts
              </span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Idempotent server deduplication active with composite provider keys and stable UUID mapping.
            </p>
          </div>

          <div className="p-3 rounded bg-surface-secondary border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-brand-primary" />
                Database Engines
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface text-text-muted font-mono text-[10px] border border-border">
                {databases.length} Databases
              </span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              PostgreSQL Base+WAL and MySQL/MariaDB engines with live connection telemetry and PITR readiness.
            </p>
          </div>

          <div className="p-3 rounded bg-surface-secondary border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-brand-primary" />
                Secrets &amp; Encryption
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface text-text-muted font-mono text-[10px] border border-border">
                AES-256-GCM
              </span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Zero plaintext storage for SSH private keys, provider credentials, and SMTP/Telegram bot tokens.
            </p>
          </div>
        </div>
      </div>

      {/* Diagnostics & Client Storage */}
      <div className="op-card p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-border">
          <Sliders className="w-4 h-4 text-brand-primary" />
          <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
            Operational Diagnostics &amp; Cache Control
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="font-semibold text-text-primary">Clear Client Route Cache</div>
            <div className="text-text-muted mt-0.5">
              Reset cached session queries and force fresh state synchronization without logging out.
            </div>
          </div>

          <button
            onClick={handleClearCache}
            className="op-btn-secondary self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5 text-brand-primary" />
            <span>{cacheCleared ? 'Cache Purged!' : 'Purge Client Cache'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
