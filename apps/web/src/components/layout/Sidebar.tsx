import React from 'react';
import {
  LayoutDashboard,
  Server,
  Cloud,
  Container,
  Database,
  HardDrive,
  ShieldCheck,
  RotateCcw,
  Activity,
  ScrollText,
  Key,
  Layers,
  Settings,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'coolify'
  | 'servers'
  | 'docker'
  | 'databases'
  | 'storage'
  | 'backups'
  | 'restore'
  | 'operations'
  | 'monitoring'
  | 'audit'
  | 'vault';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  counts?: {
    servers: number;
    databases: number;
    backups: number;
    runningJobs: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, counts }) => {
  const navSections = [
    {
      title: 'CORE',
      items: [
        { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
      ],
    },
    {
      title: 'INFRASTRUCTURE',
      items: [
        { id: 'coolify' as NavTab, label: 'Coolify Integrations', icon: Cloud },
        { id: 'servers' as NavTab, label: 'Servers', icon: Server, badge: counts?.servers },
        { id: 'docker' as NavTab, label: 'Docker Hosts', icon: Container },
      ],
    },
    {
      title: 'DATA ASSETS',
      items: [
        { id: 'databases' as NavTab, label: 'Databases', icon: Database, badge: counts?.databases },
        { id: 'storage' as NavTab, label: 'Storage Destinations', icon: HardDrive },
      ],
    },
    {
      title: 'PROTECTION & RECOVERY',
      items: [
        { id: 'backups' as NavTab, label: 'Backups & Policies', icon: ShieldCheck, badge: counts?.backups },
        { id: 'restore' as NavTab, label: 'Restore Center', icon: RotateCcw },
      ],
    },
    {
      title: 'OBSERVABILITY',
      items: [
        {
          id: 'operations' as NavTab,
          label: 'Operations & Jobs',
          icon: Activity,
          badge: counts?.runningJobs && counts.runningJobs > 0 ? `${counts.runningJobs} running` : undefined,
          badgeColor: counts?.runningJobs && counts.runningJobs > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : undefined,
        },
        { id: 'monitoring' as NavTab, label: 'Health & Recovery', icon: Layers },
        { id: 'audit' as NavTab, label: 'Audit Log', icon: ScrollText },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'vault' as NavTab, label: 'Credential Vault', icon: Key },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            B
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-zinc-100 uppercase">BackupOps</h1>
            <p className="text-[11px] text-zinc-400 font-mono">Control Plane v1.0</p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-3 mb-2">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                          item.badgeColor || 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/30 text-[11px] text-zinc-400">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Self-Hosted Mode
          </span>
          <span className="font-mono text-[10px]">Docker</span>
        </div>
      </div>
    </aside>
  );
};
