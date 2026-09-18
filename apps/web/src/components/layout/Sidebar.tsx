import React, { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
  Bell,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  counts?: {
    servers: number;
    databases: number;
    backups: number;
    runningJobs: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose, counts }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { path: '/overview', label: 'Overview', icon: LayoutDashboard },
      ],
    },
    {
      title: 'INFRASTRUCTURE',
      items: [
        { path: '/infrastructure/coolify', label: 'Coolify', icon: Cloud },
        { path: '/infrastructure/servers', label: 'Servers', icon: Server, badge: counts?.servers },
        { path: '/infrastructure/docker', label: 'Docker', icon: Container },
      ],
    },
    {
      title: 'DATA',
      items: [
        { path: '/databases', label: 'Databases', icon: Database, badge: counts?.databases },
        { path: '/storage', label: 'Storage', icon: HardDrive },
      ],
    },
    {
      title: 'PROTECTION',
      items: [
        { path: '/backups', label: 'Backups', icon: ShieldCheck, badge: counts?.backups },
        { path: '/restore', label: 'Restore', icon: RotateCcw },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          path: '/operations',
          label: 'Jobs',
          icon: Activity,
          badge: counts?.runningJobs && counts.runningJobs > 0 ? `${counts.runningJobs} running` : undefined,
          badgeColor: counts?.runningJobs && counts.runningJobs > 0 ? 'bg-warning-muted text-warning border border-warning/30' : undefined,
        },
      ],
    },
    {
      title: 'OBSERVABILITY',
      items: [
        { path: '/monitoring', label: 'Health', icon: Layers },
        { path: '/audit', label: 'Audit Logs', icon: ScrollText },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { path: '/notifications', label: 'Notifications', icon: Bell },
        { path: '/vault', label: 'Vault', icon: Key },
        { path: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const isItemActive = (path: string) => {
    if (path === '/overview') {
      return location.pathname === '/overview' || location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] bg-surface border-r border-border flex flex-col h-screen select-none transition-transform duration-200 ease-in-out md:static md:w-60 md:h-screen md:translate-x-0 md:z-auto shrink-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link
            to="/overview"
            onClick={onClose}
            className="flex items-center gap-2.5 text-inherit no-underline"
          >
            <div className="w-7 h-7 rounded-md bg-surface-secondary border border-border flex items-center justify-center text-text-primary font-mono font-semibold text-xs shadow-xs">
              B
            </div>
            <div>
              <h1 className="font-semibold text-xs tracking-wider text-text-primary uppercase">
                BackupOps
              </h1>
              <p className="text-[10px] text-text-muted font-mono">Control Plane</p>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="p-1 text-text-muted hover:text-text-primary rounded-md md:hidden cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="text-[10px] font-semibold text-text-muted tracking-wider uppercase px-2 mb-1">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isItemActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavClick(item.path)}
                      className={`relative w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left cursor-pointer ${
                        isActive
                          ? 'bg-accent/10 text-accent border border-accent/20 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-accent before:rounded-full'
                          : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pl-1">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-accent' : 'text-text-muted'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ml-1.5 ${
                            item.badgeColor ||
                            'bg-surface-elevated text-text-muted border border-border'
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

        {/* Footer Status */}
        <div className="p-3 border-t border-border bg-surface-secondary/40 text-[11px] text-text-muted">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              <span>Self-Hosted</span>
            </span>
            <span className="font-mono text-[10px]">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
