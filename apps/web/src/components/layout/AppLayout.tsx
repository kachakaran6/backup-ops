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
      return { title: 'Server Details' };
    }
    if (path.startsWith('/databases/')) {
      return { title: 'Database Details' };
    }

    switch (path) {
      case '/overview':
      case '/':
        return { title: 'Overview' };
      case '/infrastructure/coolify':
        return { title: 'Coolify' };
      case '/infrastructure/servers':
        return { title: 'Servers' };
      case '/infrastructure/docker':
        return { title: 'Docker Volumes' };
      case '/databases':
        return { title: 'Databases' };
      case '/storage':
        return { title: 'Storage' };
      case '/backups':
        return { title: 'Backups' };
      case '/restore':
        return { title: 'Restore' };
      case '/operations':
        return { title: 'Operations' };
      case '/monitoring':
        return { title: 'Monitoring' };
      case '/notifications':
        return { title: 'Notifications' };
      case '/vault':
        return { title: 'Credentials Vault' };
      case '/audit':
        return { title: 'Audit Logs' };
      case '/settings':
        return { title: 'Settings' };
      default:
        return { title: 'BackupOps' };
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
