import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginView } from './views/LoginView';
import { OverviewView } from './views/OverviewView';
import { CoolifyView } from './views/CoolifyView';
import { ServersView } from './views/ServersView';
import { ServerDetailView } from './views/ServerDetailView';
import { DockerView } from './views/DockerView';
import { DatabasesView } from './views/DatabasesView';
import { DatabaseDetailView } from './views/DatabaseDetailView';
import { StorageView } from './views/StorageView';
import { BackupsView } from './views/BackupsView';
import { RestoreView } from './views/RestoreView';
import { OperationsView } from './views/OperationsView';
import { MonitoringView } from './views/MonitoringView';
import { NotificationsView } from './views/NotificationsView';
import { VaultView } from './views/VaultView';
import { AuditLogView } from './views/AuditLogView';
import { SettingsView } from './views/SettingsView';
import { useControlPlane } from './context/ControlPlaneContext';

// Route Adapters
const OverviewRoute: React.FC = () => {
  const { stats, servers, databases, storageDestinations, backups, chains } = useControlPlane();
  const navigate = useNavigate();
  return (
    <OverviewView
      stats={stats}
      servers={servers}
      databases={databases}
      storageDestinations={storageDestinations}
      backups={backups}
      chains={chains}
      onNavigate={(tab: string) => {
        const map: Record<string, string> = {
          coolify: '/infrastructure/coolify',
          servers: '/infrastructure/servers',
          docker: '/infrastructure/docker',
          databases: '/databases',
          storage: '/storage',
          backups: '/backups',
          restore: '/restore',
          operations: '/operations',
          monitoring: '/monitoring',
          notifications: '/notifications',
          vault: '/vault',
          audit: '/audit',
          settings: '/settings',
        };
        navigate(map[tab] || `/${tab}`);
      }}
      onConnectCoolify={() => navigate('/infrastructure/coolify')}
      onAddServer={() => navigate('/infrastructure/servers')}
    />
  );
};

const CoolifyRoute: React.FC = () => {
  const { connections, refresh } = useControlPlane();
  const navigate = useNavigate();
  return (
    <CoolifyView
      connections={connections}
      onRefresh={refresh}
      onNavigateToServer={(serverId: string) =>
        navigate(`/infrastructure/servers/${serverId}`)
      }
    />
  );
};

const ServersRoute: React.FC = () => {
  const { servers, refresh } = useControlPlane();
  const navigate = useNavigate();
  return (
    <ServersView
      servers={servers}
      onRefresh={refresh}
      onSelectServer={(s) => navigate(`/infrastructure/servers/${s.id}`)}
    />
  );
};

const ServerDetailRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { servers } = useControlPlane();
  const navigate = useNavigate();
  const server = servers.find((s) => s.id === id);

  if (!server) {
    return (
      <div className="p-8 text-center op-card max-w-md mx-auto my-12">
        <h3 className="text-sm font-semibold text-text-primary">Server Not Found</h3>
        <p className="text-xs text-text-muted mt-1">
          The requested server ID does not exist or has been reconciled.
        </p>
        <button
          onClick={() => navigate('/infrastructure/servers')}
          className="op-btn-secondary mt-4"
        >
          Back to Servers
        </button>
      </div>
    );
  }

  return (
    <ServerDetailView
      server={server}
      onBack={() => navigate('/infrastructure/servers')}
      onSelectDatabase={(db) => navigate(`/databases/${db.id}`)}
    />
  );
};

const DatabasesRoute: React.FC = () => {
  const { databases, refresh } = useControlPlane();
  const navigate = useNavigate();
  return (
    <DatabasesView
      databases={databases}
      onRefresh={refresh}
      onSelectDatabase={(db) => navigate(`/databases/${db.id}`)}
      onTriggerBackup={() => navigate('/backups')}
    />
  );
};

const DatabaseDetailRoute: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { databases } = useControlPlane();
  const navigate = useNavigate();
  const database = databases.find((d) => d.id === id);

  if (!database) {
    return (
      <div className="p-8 text-center op-card max-w-md mx-auto my-12">
        <h3 className="text-sm font-semibold text-text-primary">Database Not Found</h3>
        <p className="text-xs text-text-muted mt-1">
          The requested database workload does not exist in the active catalog.
        </p>
        <button
          onClick={() => navigate('/databases')}
          className="op-btn-secondary mt-4"
        >
          Back to Databases
        </button>
      </div>
    );
  }

  return (
    <DatabaseDetailView
      database={database}
      onBack={() => navigate('/databases')}
      onTriggerBackup={() => navigate('/backups')}
      onRestoreBackup={(b) => navigate(`/restore?backupId=${b.id}`)}
    />
  );
};

const StorageRoute: React.FC = () => {
  const { storageDestinations, refresh } = useControlPlane();
  return <StorageView storageDestinations={storageDestinations} onRefresh={refresh} />;
};

const BackupsRoute: React.FC = () => {
  const navigate = useNavigate();
  return <BackupsView onRestore={(b) => navigate(`/restore?backupId=${b.id}`)} />;
};

const RestoreRoute: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { backups } = useControlPlane();
  const backupId = searchParams.get('backupId');
  const preselected = backups.find((b) => b.id === backupId);
  return <RestoreView preselectedBackup={preselected} />;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthenticated Login Route */}
        <Route path="/login" element={<LoginView />} />

        {/* Authenticated Application Shell */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewRoute />} />
          <Route path="/infrastructure/coolify" element={<CoolifyRoute />} />
          <Route path="/infrastructure/servers" element={<ServersRoute />} />
          <Route path="/infrastructure/servers/:id" element={<ServerDetailRoute />} />
          <Route path="/infrastructure/docker" element={<DockerView />} />
          <Route path="/databases" element={<DatabasesRoute />} />
          <Route path="/databases/:id" element={<DatabaseDetailRoute />} />
          <Route path="/storage" element={<StorageRoute />} />
          <Route path="/backups" element={<BackupsRoute />} />
          <Route path="/restore" element={<RestoreRoute />} />
          <Route path="/operations" element={<OperationsView />} />
          <Route path="/monitoring" element={<MonitoringView />} />
          <Route path="/notifications" element={<NotificationsView />} />
          <Route path="/vault" element={<VaultView />} />
          <Route path="/audit" element={<AuditLogView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Route>

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
