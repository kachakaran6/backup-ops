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
  Layers,
  ScrollText,
  Key,
  Settings,
  Bell,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  counts?: {
    servers: number;
    databases: number;
    backups: number;
    runningJobs: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = false,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  counts,
}) => {
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
        { path: '/infrastructure/docker', label: 'Docker & Volumes', icon: Container },
      ],
    },
    {
      title: 'DATA & STORAGE',
      items: [
        { path: '/databases', label: 'Databases', icon: Database, badge: counts?.databases },
        { path: '/storage', label: 'Storage', icon: HardDrive },
      ],
    },
    {
      title: 'PROTECTION',
      items: [
        { path: '/backups', label: 'Backups & Chains', icon: ShieldCheck, badge: counts?.backups },
        { path: '/restore', label: 'Restore Center', icon: RotateCcw },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        {
          path: '/operations',
          label: 'Jobs & Tasks',
          icon: Activity,
          badge: counts?.runningJobs && counts.runningJobs > 0 ? `${counts.runningJobs} running` : undefined,
          badgeColor:
            counts?.runningJobs && counts.runningJobs > 0
              ? 'bg-warning/15 text-warning border border-warning/30 font-semibold'
              : undefined,
        },
      ],
    },
    {
      title: 'OBSERVABILITY',
      items: [
        { path: '/monitoring', label: 'Platform Health', icon: Layers },
        { path: '/audit', label: 'Audit Trail', icon: ScrollText },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { path: '/notifications', label: 'Alert Channels', icon: Bell },
        { path: '/vault', label: 'Secret Vault', icon: Key },
        { path: '/settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full select-none bg-sidebar text-sidebar-text">
      {/* Brand Header */}
      <div className="h-14 border-b border-sidebar-border px-3.5 flex items-center justify-between shrink-0">
        <Link
          to="/overview"
          onClick={() => onClose && onClose()}
          className="flex items-center gap-2.5 min-w-0 group"
        >
          <div className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/30 flex items-center justify-center text-brand shrink-0 group-hover:bg-brand/25 transition-colors">
            <Shield className="w-4 h-4 fill-brand/20" />
          </div>

          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold tracking-tight text-sidebar-text font-mono">
                  BackupOps
                </span>
                <span className="text-[9px] font-mono font-medium px-1 py-0.2 rounded bg-brand/10 text-brand border border-brand/25">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-sidebar-muted tracking-wide truncate">
                CONTROL PLANE
              </p>
            </div>
          )}
        </Link>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-md text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-surface"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Desktop Collapse button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex p-1 rounded-md text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-surface transition-colors"
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            {!isCollapsed && (
              <div className="px-2.5 py-1 text-[10px] font-mono font-semibold tracking-wider text-sidebar-muted uppercase">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/overview' && location.pathname.startsWith(item.path));
                const Icon = item.icon;

                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavClick(item.path)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer group ${
                      isActive
                        ? 'bg-sidebar-active text-sidebar-active-text font-semibold border-l-2 border-brand pl-2'
                        : 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-surface'
                    } ${isCollapsed ? 'justify-center !px-2' : ''}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive
                            ? 'text-brand'
                            : 'text-sidebar-muted group-hover:text-sidebar-text'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          item.badgeColor ||
                          (isActive
                            ? 'bg-brand/20 text-brand'
                            : 'bg-sidebar-surface text-sidebar-muted')
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
      </nav>

      {/* Footer System Strip */}
      {!isCollapsed && (
        <div className="p-3 border-t border-sidebar-border text-[11px] text-sidebar-muted shrink-0 flex items-center justify-between font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] uppercase">Engine Ready</span>
          </div>
          <span className="text-[10px] opacity-60">Docker host</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden md:block border-r border-sidebar-border h-screen shrink-0 transition-all duration-200 z-30 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Sheet) */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onClose}
          />

          {/* Drawer content */}
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
