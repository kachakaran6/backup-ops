import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useControlPlane } from '../../context/ControlPlaneContext';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { stats, servers, databases, backups, refresh, isRefreshing } = useControlPlane();

  const getHeaderInfo = () => {
    const path = location.pathname;

    if (path.startsWith('/infrastructure/servers/')) {
      return {
        title: 'Server Operational Details',
        subtitle: 'Live system status, Docker environment, and associated databases',
      };
    }
    if (path.startsWith('/databases/')) {
      return {
        title: 'Database Operational Details',
        subtitle: 'Telemetry, Point-In-Time Recovery readiness, and backup history',
      };
    }

    switch (path) {
      case '/overview':
      case '/':
        return {
          title: 'System Operations Control Plane',
          subtitle: 'Live infrastructure health, database protection, storage destinations, and recovery chains',
        };
      case '/infrastructure/coolify':
        return {
          title: 'Coolify Infrastructure Discovery',
          subtitle: 'First-class read-only inventory source for servers, applications, databases, and services',
        };
      case '/infrastructure/servers':
        return {
          title: 'Infrastructure Servers',
          subtitle: 'Coolify-discovered and direct SSH-managed Linux hosts',
        };
      case '/infrastructure/docker':
        return {
          title: 'Docker Runtime & Storage Volumes',
          subtitle: 'Host container daemons and distinction between volume snapshots and database dumps',
        };
      case '/databases':
        return {
          title: 'Database Data Protection',
          subtitle: 'PostgreSQL Base+WAL, MySQL/MariaDB engines with live connection telemetry',
        };
      case '/storage':
        return {
          title: 'Storage Destinations',
          subtitle: 'Local host volume mounts, AWS S3, MinIO, and S3-compatible endpoints',
        };
      case '/backups':
        return {
          title: 'Automated Backup Policies & History',
          subtitle: 'Policy schedules, streaming SHA-256 verification badges, and artifact metadata',
        };
      case '/restore':
        return {
          title: 'Disaster Recovery & Restore Center',
          subtitle: 'Target redirection, point-in-time recovery, and confirmation-protected operations',
        };
      case '/operations':
        return {
          title: 'Operations & Asynchronous Worker Jobs',
          subtitle: 'BullMQ queue state machine, progress metrics, and live execution logs',
        };
      case '/monitoring':
        return {
          title: 'Platform Observability & Recovery Health',
          subtitle: 'Service health, database RPO freshness, and recovery chain validation',
        };
      case '/notifications':
        return {
          title: 'Notifications & Alert Integrations',
          subtitle: 'SMTP Email, Telegram Bot, Pushover, and Gotify incident dispatch channels',
        };
      case '/vault':
        return {
          title: 'Encrypted Credential Vault',
          subtitle: 'AES-256-GCM zero-leak secret storage for SSH keys, tokens, and database passwords',
        };
      case '/audit':
        return {
          title: 'Security & Operational Audit Trail',
          subtitle: 'Immutable compliance logging of administrative and destructive activities',
        };
      case '/settings':
        return {
          title: 'System Settings & Workspace Configuration',
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
          onQuickAction={handleQuickAction}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full min-w-0 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
