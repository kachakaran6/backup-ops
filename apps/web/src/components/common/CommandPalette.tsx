import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Server,
  Cloud,
  Container,
  Database,
  HardDrive,
  ShieldCheck,
  RotateCcw,
  Activity,
  Layers,
  ScrollText,
  Bell,
  Key,
  Settings,
  Sun,
  Moon,
  Plus,
  ArrowRight,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface CommandItem {
  id: string;
  category: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, setTheme, toggleTheme, setPalette } = useTheme();

  const commands: CommandItem[] = [
    // Core 8 Navigation Routes
    {
      id: 'nav-overview',
      category: 'Navigation',
      title: 'Overview',
      description: 'System health, recent operations & recovery readiness',
      icon: LayoutDashboard,
      action: () => { navigate('/overview'); onClose(); },
      keywords: ['dashboard', 'home', 'status', 'summary', 'health'],
    },
    {
      id: 'nav-servers',
      category: 'Navigation',
      title: 'Servers',
      description: 'Linux hosts, SSH connectivity & hardware telemetry',
      icon: Server,
      action: () => { navigate('/servers'); onClose(); },
      keywords: ['host', 'ssh', 'linux', 'node', 'hardware', 'vps'],
    },
    {
      id: 'nav-databases',
      category: 'Navigation',
      title: 'Databases',
      description: 'PostgreSQL Base+WAL, MySQL, MariaDB workloads',
      icon: Database,
      action: () => { navigate('/databases'); onClose(); },
      keywords: ['postgres', 'mysql', 'sql', 'mariadb', 'database'],
    },
    {
      id: 'nav-backups',
      category: 'Navigation',
      title: 'Backups & Recovery',
      description: 'Snapshot history, recovery points & SHA-256 integrity verification',
      icon: ShieldCheck,
      action: () => { navigate('/backups'); onClose(); },
      keywords: ['backup', 'snapshot', 'chain', 'restore', 'verify', 'recovery'],
    },
    {
      id: 'nav-transfers',
      category: 'Navigation',
      title: 'Transfers & Migrations',
      description: 'Server-to-server data movement, copy, move & live progress',
      icon: ArrowRight,
      action: () => { navigate('/transfers'); onClose(); },
      keywords: ['transfer', 'copy', 'move', 'sync', 'migrate', 'speed', 'eta'],
    },
    {
      id: 'nav-storage',
      category: 'Navigation',
      title: 'Storage Destinations',
      description: 'AWS S3, MinIO, SFTP, and local volumes',
      icon: HardDrive,
      action: () => { navigate('/storage'); onClose(); },
      keywords: ['s3', 'bucket', 'minio', 'sftp', 'storage', 'disk'],
    },
    {
      id: 'nav-schedules',
      category: 'Navigation',
      title: 'Schedules & Retention',
      description: 'Automated backup schedules and pruning retention rules',
      icon: Clock,
      action: () => { navigate('/schedules'); onClose(); },
      keywords: ['schedule', 'cron', 'retention', 'daily', 'weekly', 'prune'],
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'Settings',
      description: 'System appearance, credentials vault, notifications & Coolify',
      icon: Settings,
      action: () => { navigate('/settings'); onClose(); },
      keywords: ['config', 'settings', 'admin', 'profile', 'theme', 'notifications', 'vault', 'coolify', 'audit'],
    },

    // Quick Actions
    {
      id: 'act-backup',
      category: 'Actions',
      title: 'Trigger Backup Now',
      description: 'Initiate on-demand backup for protected workload',
      icon: Plus,
      action: () => { navigate('/backups'); onClose(); },
      keywords: ['run', 'trigger', 'backup', 'start'],
    },
    {
      id: 'act-coolify',
      category: 'Actions',
      title: 'Connect Coolify Instance',
      description: 'Register a self-hosted Coolify API connection',
      icon: Cloud,
      action: () => { navigate('/infrastructure/coolify'); onClose(); },
      keywords: ['connect', 'coolify', 'add', 'api'],
    },
    {
      id: 'act-server',
      category: 'Actions',
      title: 'Add Linux Server (SSH)',
      description: 'Provision a direct SSH or agent target',
      icon: Server,
      action: () => { navigate('/infrastructure/servers'); onClose(); },
      keywords: ['add', 'server', 'ssh', 'host'],
    },
    {
      id: 'act-theme',
      category: 'Appearance',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      description: 'Toggle visual appearance between Dark and Light mode',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => { toggleTheme(); onClose(); },
      keywords: ['theme', 'dark', 'light', 'mode', 'color'],
    },
    {
      id: 'palette-amber',
      category: 'Themes',
      title: 'Theme: Warm Amber',
      description: 'Warm Orange and Deep Charcoal signature',
      icon: Sun,
      action: () => { setPalette('amber'); onClose(); },
      keywords: ['theme', 'amber', 'orange', 'charcoal', 'color'],
    },
    {
      id: 'palette-indigo',
      category: 'Themes',
      title: 'Theme: Royal Indigo',
      description: 'Royal Indigo with Soft Sky Blue',
      icon: Sun,
      action: () => { setPalette('indigo'); onClose(); },
      keywords: ['theme', 'indigo', 'blue', 'sky', 'color'],
    },
    {
      id: 'palette-emerald',
      category: 'Themes',
      title: 'Theme: Cyber Emerald',
      description: 'Vibrant Cyber Emerald with Midnight Obsidian',
      icon: Sun,
      action: () => { setPalette('emerald'); onClose(); },
      keywords: ['theme', 'emerald', 'green', 'cyber', 'color'],
    },
    {
      id: 'palette-violet',
      category: 'Themes',
      title: 'Theme: Electric Violet',
      description: 'Royal Violet with Azure & Bright Cyan',
      icon: Sun,
      action: () => { setPalette('violet'); onClose(); },
      keywords: ['theme', 'violet', 'purple', 'azure', 'color'],
    },
    {
      id: 'palette-neon',
      category: 'Themes',
      title: 'Theme: Neon Orchid',
      description: 'Neon Orchid Purple with Mint & Coral',
      icon: Sun,
      action: () => { setPalette('neon'); onClose(); },
      keywords: ['theme', 'neon', 'orchid', 'mint', 'coral', 'color'],
    },
  ];

  // Filter commands
  const filtered = commands.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    if (c.title.toLowerCase().includes(q)) return true;
    if (c.description?.toLowerCase().includes(q)) return true;
    if (c.keywords?.some((k) => k.toLowerCase().includes(q))) return true;
    return false;
  });

  // Keyboard navigation inside palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Group filtered commands
  const groups: Record<string, CommandItem[]> = {};
  filtered.forEach((c) => {
    if (!groups[c.category]) groups[c.category] = [];
    groups[c.category].push(c);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-100">
      <div
        className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-border gap-3 shrink-0 bg-surface">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search resources..."
            className="bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none flex-1 font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-text-muted hover:text-text-primary p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-secondary border border-border text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-3 flex-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-xs">
              No matching commands or resources found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(groups).map(([category, items]) => (
              <div key={category} className="space-y-1">
                <div className="text-[10px] font-mono font-semibold text-text-muted uppercase tracking-wider px-2 py-1">
                  {category}
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const currentIndex = filtered.findIndex((f) => f.id === item.id);
                    const isSelected = selectedIndex === currentIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-brand/10 text-text-primary border border-brand/20'
                            : 'text-text-secondary hover:bg-surface-secondary border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? 'text-brand' : 'text-text-muted'
                            }`}
                          />
                          <div className="truncate">
                            <div
                              className={`font-medium truncate ${
                                isSelected ? 'text-brand' : 'text-text-primary'
                              }`}
                            >
                              {item.title}
                            </div>
                            {item.description && (
                              <div className="text-[11px] text-text-muted truncate">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <ArrowRight className="w-3.5 h-3.5 text-brand shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-border bg-surface-secondary/50 text-[11px] font-mono text-text-muted flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-text-muted">BackupOps Console</span>
        </div>
      </div>
    </div>
  );
};
