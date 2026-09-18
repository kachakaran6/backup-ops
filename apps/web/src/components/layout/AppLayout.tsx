import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from '../common/CommandPalette';
import { useControlPlane } from '../../context/ControlPlaneContext';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('backupops_sidebar_collapsed') === 'true';
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { stats, servers, databases, backups, refresh, isRefreshing } = useControlPlane();

  // Hotkey listener: Cmd+K for Command Palette, Cmd+B for Sidebar Collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => {
          const next = !prev;
          localStorage.setItem('backupops_sidebar_collapsed', String(next));
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('backupops_sidebar_collapsed', String(next));
      return next;
    });
  };

  const getHeaderInfo = () => {
    const path = location.pathname;

    if (path.startsWith('/infrastructure/servers/')) {
      return {
        title: 'Server Telemetry & Workloads',
        subtitle: 'Hardware gauges, Docker container instances, and detected databases',
      };
    }
    if (path.startsWith('/databases/')) {
      return {
        title: 'Database Protection & PITR',
        subtitle: 'Point-In-Time Recovery readiness, WAL archiving status, and backup history',
      };
    }

    switch (path) {
      case '/overview':
      case '/':
        return {
          title: 'Operations Overview',
          subtitle: 'System health strip, active job throughput, and recovery readiness',
        };
      case '/infrastructure/coolify':
        return {
          title: 'Coolify Infrastructure',
          subtitle: 'Read-only synchronized inventory of servers, applications, and managed databases',
        };
      case '/infrastructure/servers':
        return {
          title: 'Infrastructure Servers',
          subtitle: 'Coolify-discovered nodes and SSH-managed Linux host catalog',
        };
      case '/infrastructure/docker':
        return {
          title: 'Docker & Storage Volumes',
          subtitle: 'Host container daemons and distinction between volume snapshots and database dumps',
        };
      case '/databases':
        return {
          title: 'Database Catalog',
          subtitle: 'PostgreSQL Base+WAL, MySQL, and MariaDB engines with live connection telemetry',
        };
      case '/storage':
        return {
          title: 'Storage Destinations',
          subtitle: 'Local volume mounts, AWS S3, MinIO, and S3-compatible endpoints',
        };
      case '/backups':
        return {
          title: 'Backups & Recovery Chains',
          subtitle: 'Policy schedules, streaming SHA-256 verification badges, and artifact lineage',
        };
      case '/restore':
        return {
          title: 'Disaster Recovery & Restore',
          subtitle: 'Target redirection, point-in-time recovery, and confirmation-protected rollback',
        };
      case '/operations':
        return {
          title: 'Operations & Worker Jobs',
          subtitle: 'Asynchronous task state machine, transfer throughput, and live terminal logs',
        };
      case '/monitoring':
        return {
          title: 'Platform Observability',
          subtitle: 'Service health, database RPO freshness, and recovery chain validation',
        };
      case '/notifications':
        return {
          title: 'Notifications & Alert Channels',
          subtitle: 'SMTP Email, Telegram Bot, Pushover, and Gotify incident dispatch rules',
        };
      case '/vault':
        return {
          title: 'Encrypted Credential Vault',
          subtitle: 'AES-256-GCM zero-leak secret storage for SSH keys, tokens, and database credentials',
        };
      case '/audit':
        return {
          title: 'Audit Trail',
          subtitle: 'Immutable compliance logging of administrative, data movement, and destructive activities',
        };
      case '/settings':
        return {
          title: 'Workspace Settings',
          subtitle: 'Control plane preferences, admin credentials management, and platform info',
        };
      default:
        return {
          title: 'BackupOps Control Plane',
          subtitle: 'Infrastructure data operations and recovery orchestration',
        };
    }
  };

  const handleQuickAction = (action: 'coolify' | 'server' | 'backup') => {
    if (action === 'coolify') navigate('/infrastructure/coolify');
    if (action === 'server') navigate('/infrastructure/servers');
    if (action === 'backup') navigate('/backups');
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="flex h-screen bg-background text-text-primary font-sans overflow-hidden">
      {/* Responsive Navigation Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        counts={{
          servers: servers.length,
          databases: databases.length,
          backups: backups.length,
          runningJobs: stats.backups.activeOperations,
        }}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onQuickAction={handleQuickAction}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 w-full min-w-0 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};
