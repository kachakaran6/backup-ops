import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useControlPlane } from '../context/ControlPlaneContext';
import { useTheme, PaletteMode } from '../context/ThemeContext';
import {
  Settings,
  User,
  Shield,
  Key,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Sliders,
  Sun,
  Moon,
  Monitor,
  Check,
  Palette,
  Bell,
  Cloud,
  ScrollText,
} from 'lucide-react';
import { NotificationsView } from './NotificationsView';
import { VaultView } from './VaultView';
import { CoolifyView } from './CoolifyView';
import { AuditLogView } from './AuditLogView';

interface ThemePaletteOption {
  id: PaletteMode;
  name: string;
  description: string;
  primaryColors: string[];
  supportingColors: string[];
}

const PALETTE_OPTIONS: ThemePaletteOption[] = [
  {
    id: 'amber',
    name: 'Warm Amber',
    description: 'Signature Warm Orange with Deep Charcoal',
    primaryColors: ['#F29F67', '#1E1E2C'],
    supportingColors: ['#3B8FF3', '#34B1AA', '#E0B50F'],
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    description: 'Deep Royal Indigo with Soft Sky Blue',
    primaryColors: ['#4B49AC', '#98BDFF'],
    supportingColors: ['#7DA0FA', '#7978E9', '#F3797E'],
  },
  {
    id: 'emerald',
    name: 'Cyber Emerald',
    description: 'Vibrant Cyber Emerald with Midnight Obsidian',
    primaryColors: ['#38CE3C', '#181824'],
    supportingColors: ['#FF4D6B', '#FFDE73', '#8E32E9'],
  },
  {
    id: 'violet',
    name: 'Electric Violet',
    description: 'Royal Violet with Azure & Bright Cyan',
    primaryColors: ['#6F42C1', '#007BFF'],
    supportingColors: ['#00CCCC', '#0DCAF0', '#17A2B8'],
  },
  {
    id: 'neon',
    name: 'Neon Orchid',
    description: 'Neon Orchid Purple with Mint & Coral',
    primaryColors: ['#A05AFF', '#1BCFB4'],
    supportingColors: ['#4BCBEB', '#FE9496', '#9E58FF'],
  },
];

type SettingsTab = 'general' | 'notifications' | 'vault' | 'coolify' | 'audit';

export const SettingsView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'general';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const { user, logout } = useAuth();
  const { connections, refresh, isRefreshing } = useControlPlane();
  const { theme, setTheme, resolvedTheme, palette, setPalette } = useTheme();
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as SettingsTab;
    if (tabParam && ['general', 'notifications', 'vault', 'coolify', 'audit'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'general' ? {} : { tab });
  };

  const handleClearCache = () => {
    sessionStorage.clear();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header and Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border">
        <div>
          <h2 className="text-sm font-semibold text-text-primary tracking-tight font-mono uppercase">
            Settings &amp; Platform Configuration
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Configure system appearance, alert channels, security credentials, and integrations.
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={isRefreshing}
          className="op-btn-secondary self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-brand-primary' : 'text-text-muted'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-border text-xs font-medium overflow-x-auto pb-1">
        {[
          { id: 'general', label: 'Appearance & Session', icon: Sliders },
          { id: 'notifications', label: 'Alert Channels', icon: Bell },
          { id: 'vault', label: 'Credentials Vault', icon: Key },
          { id: 'coolify', label: 'Coolify Discovery', icon: Cloud },
          { id: 'audit', label: 'Audit Trail', icon: ScrollText },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as SettingsTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer border text-xs font-mono ${
                active
                  ? 'bg-surface-elevated text-brand-primary border-brand-primary/40 font-semibold'
                  : 'text-text-muted hover:text-text-primary border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: General & Appearance */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          {/* 5 Color Theme Palettes Switcher */}
          <div className="op-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-brand-primary" />
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
                  Color Theme Palettes
                </h3>
              </div>
              <span className="text-xs font-mono text-brand-primary font-medium">
                Active: {PALETTE_OPTIONS.find((p) => p.id === palette)?.name || 'Warm Amber'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {PALETTE_OPTIONS.map((p) => {
                const isSelected = palette === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPalette(p.id)}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                      isSelected
                        ? 'border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary'
                        : 'border-border bg-surface-secondary hover:border-border-strong hover:bg-surface-elevated'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-text-primary">
                          {p.name}
                        </span>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-brand-primary shrink-0" />
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full border border-border group-hover:border-text-muted" />
                        )}
                      </div>
                      <p className="text-[11px] text-text-muted leading-tight mb-3">
                        {p.description}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/50">
                      <div>
                        <span className="text-[9px] font-mono uppercase text-text-muted block mb-0.5">
                          Primary
                        </span>
                        <div className="flex h-3.5 rounded overflow-hidden border border-border">
                          {p.primaryColors.map((color, idx) => (
                            <div
                              key={idx}
                              style={{ backgroundColor: color }}
                              className="flex-1"
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono uppercase text-text-muted block mb-0.5">
                          Supporting
                        </span>
                        <div className="flex h-2.5 rounded overflow-hidden border border-border">
                          {p.supportingColors.map((color, idx) => (
                            <div
                              key={idx}
                              style={{ backgroundColor: color }}
                              className="flex-1"
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Surface Appearance Mode (Dark / Light / System) */}
          <div className="op-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="space-y-0.5">
                <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
                  Surface Brightness Mode
                </h3>
                <p className="text-[11px] text-text-muted">
                  Select between deep charcoal dark mode and high-contrast light mode.
                </p>
              </div>
              <span className="text-xs font-mono text-text-muted uppercase">
                {resolvedTheme}
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
                    Charcoal foundation (#1E1E2C) tuned for low eye fatigue.
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
                    Clean light surfaces with crisp borders and high contrast.
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
                    Synchronizes automatically with your OS preference.
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
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
                Active Operator Session
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="bg-surface-secondary p-2.5 rounded border border-border">
                <div className="text-text-muted mb-1 text-[10px] uppercase">Email</div>
                <div className="font-semibold text-text-primary truncate">{user?.email || 'admin@gmail.com'}</div>
              </div>
              <div className="bg-surface-secondary p-2.5 rounded border border-border">
                <div className="text-text-muted mb-1 text-[10px] uppercase">Username</div>
                <div className="font-semibold text-text-primary truncate">{user?.username || 'admin'}</div>
              </div>
              <div className="bg-surface-secondary p-2.5 rounded border border-border">
                <div className="text-text-muted mb-1 text-[10px] uppercase">Role</div>
                <div className="font-semibold text-text-primary truncate">{user?.role || 'Administrator'}</div>
              </div>
              <div className="bg-surface-secondary p-2.5 rounded border border-border">
                <div className="text-text-muted mb-1 text-[10px] uppercase">Organization</div>
                <div className="text-text-secondary truncate">{user?.organizationId || 'default'}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-text-muted flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                <span>Protected by cryptographic JWT bearer tokens with automatic session refresh.</span>
              </div>
              <button
                onClick={logout}
                className="op-btn-danger self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Diagnostics & Cache Control */}
          <div className="op-card p-4 space-y-3">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border">
              <Sliders className="w-4 h-4 text-brand-primary" />
              <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono">
                Cache &amp; Storage Control
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-semibold text-text-primary">Reset Client Storage Cache</div>
                <div className="text-text-muted mt-0.5">
                  Clears browser session caches and triggers fresh state queries.
                </div>
              </div>

              <button
                onClick={handleClearCache}
                className="op-btn-secondary self-start sm:self-auto"
              >
                <RefreshCw className="w-3.5 h-3.5 text-brand-primary" />
                <span>{cacheCleared ? 'Cache Cleared!' : 'Clear Client Cache'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Notifications */}
      {activeTab === 'notifications' && <NotificationsView />}

      {/* Tab 3: Credentials Vault */}
      {activeTab === 'vault' && <VaultView />}

      {/* Tab 4: Coolify Discovery */}
      {activeTab === 'coolify' && (
        <CoolifyView
          connections={connections}
          onRefresh={refresh}
        />
      )}

      {/* Tab 5: Audit Log */}
      {activeTab === 'audit' && <AuditLogView />}
    </div>
  );
};
