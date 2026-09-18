import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
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
import { VaultView } from './views/VaultView';
import { AuditLogView } from './views/AuditLogView';
import {
  Server as ServerType,
  Database as DatabaseType,
  StorageDestination,
  CoolifyConnection,
  Backup,
  BackupChain,
  Policy,
  RestoreJob,
  DashboardStats,
} from './types';
import * as api from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [selectedServer, setSelectedServer] = useState<ServerType | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType | null>(null);
  const [preselectedRestoreBackup, setPreselectedRestoreBackup] = useState<Backup | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Core domain state
  const [stats, setStats] = useState<DashboardStats>({
    infrastructure: { totalServers: 0, onlineServers: 0, offlineServers: 0, coolifyInstances: 0 },
    databases: { totalDatabases: 0, healthyDatabases: 0, backupOverdueDatabases: 0, unprotectedDatabases: 0 },
    backups: { last24hSuccessful: 0, last24hFailed: 0, activeOperations: 0, totalArtifacts: 0 },
    storage: { totalDestinations: 0, usedCapacityBytes: 0, availableCapacityBytes: 0 },
    recovery: { validChains: 0, brokenChains: 0 },
  });
  const [connections, setConnections] = useState<CoolifyConnection[]>([]);
  const [servers, setServers] = useState<ServerType[]>([]);
  const [databases, setDatabases] = useState<DatabaseType[]>([]);
  const [storageDestinations, setStorageDestinations] = useState<StorageDestination[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [chains, setChains] = useState<BackupChain[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);

  const loadAllData = useCallback(async () => {
    try {
      const [
        dashStats,
        coolifyList,
        serverList,
        dbList,
        storageList,
        backupList,
        chainList,
        policyList,
        restoreList,
      ] = await Promise.all([
        api.fetchDashboardStats(),
        api.fetchCoolifyConnections(),
        api.fetchServers(),
        api.fetchDatabases(),
        api.fetchStorage(),
        api.fetchBackups(),
        api.fetchBackupChains(),
        api.fetchPolicies(),
        api.fetchRestoreJobs(),
      ]);

      setStats(dashStats);
      setConnections(coolifyList);
      setServers(serverList);
      setDatabases(dbList);
      setStorageDestinations(storageList);
      setBackups(backupList);
      setChains(chainList);
      setPolicies(policyList);
      setRestoreJobs(restoreList);

      // Refresh selected entities if open
      if (selectedServer) {
        const updatedServer = serverList.find((s) => s.id === selectedServer.id);
        if (updatedServer) setSelectedServer(updatedServer);
      }
      if (selectedDatabase) {
        const updatedDb = dbList.find((d) => d.id === selectedDatabase.id);
        if (updatedDb) setSelectedDatabase(updatedDb);
      }
    } catch (err) {
      console.error('Failed to load control plane state:', err);
    }
  }, [selectedServer, selectedDatabase]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 5000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleSelectTab = (tab: NavTab) => {
    setSelectedServer(null);
    setSelectedDatabase(null);
    setActiveTab(tab);
  };

  const handleQuickAction = (action: 'coolify' | 'server' | 'backup') => {
    setSelectedServer(null);
    setSelectedDatabase(null);
    if (action === 'coolify') setActiveTab('coolify');
    if (action === 'server') setActiveTab('servers');
    if (action === 'backup') setActiveTab('backups');
  };

  const handleNavigateToServer = (serverId: string) => {
    const s = servers.find((item) => item.id === serverId);
    if (s) {
      setSelectedServer(s);
      setSelectedDatabase(null);
      setActiveTab('servers');
    }
  };

  const handleTriggerBackupForDb = (db: DatabaseType) => {
    setSelectedDatabase(null);
    setActiveTab('backups');
  };

  const handleRestoreBackup = (b: Backup) => {
    setPreselectedRestoreBackup(b);
    setSelectedDatabase(null);
    setActiveTab('restore');
  };

  const getHeaderProps = () => {
    if (selectedServer) {
      return {
        title: `Server: ${selectedServer.name}`,
        subtitle: `Operational view • ${selectedServer.os || 'Linux'} • ${selectedServer.host}`,
      };
    }
    if (selectedDatabase) {
      return {
        title: `Database: ${selectedDatabase.name}`,
        subtitle: `${selectedDatabase.type.toUpperCase()} • ${selectedDatabase.databaseName} • ${selectedDatabase.host}:${selectedDatabase.port}`,
      };
    }

    switch (activeTab) {
      case 'overview':
        return {
          title: 'System Operations Control Plane',
          subtitle: 'Live infrastructure health, database protection, storage destinations, and recovery chains',
        };
      case 'coolify':
        return {
          title: 'Coolify Infrastructure Discovery',
          subtitle: 'First-class read-only inventory source for servers, applications, databases, and services',
        };
      case 'servers':
        return {
          title: 'Infrastructure Servers',
          subtitle: 'Coolify-discovered and direct SSH-managed Linux hosts',
        };
      case 'docker':
        return {
          title: 'Docker Runtime & Storage Volumes',
          subtitle: 'Host container daemons and distinction between volume snapshots and database dumps',
        };
      case 'databases':
        return {
          title: 'Database Data Protection',
          subtitle: 'PostgreSQL Base+WAL, MySQL/MariaDB engines with live connection telemetry',
        };
      case 'storage':
        return {
          title: 'Storage Destinations',
          subtitle: 'Local host volume mounts, AWS S3, MinIO, and S3-compatible endpoints',
        };
      case 'backups':
        return {
          title: 'Automated Backup Policies & History',
          subtitle: 'Policy schedules, streaming SHA-256 verification badges, and artifact metadata',
        };
      case 'restore':
        return {
          title: 'Disaster Recovery & Restore Center',
          subtitle: 'Target redirection, point-in-time recovery, and confirmation-protected operations',
        };
      case 'operations':
        return {
          title: 'Operations & Asynchronous Worker Jobs',
          subtitle: 'BullMQ queue state machine, progress metrics, and live execution logs',
        };
      case 'monitoring':
        return {
          title: 'Platform Observability & Recovery Health',
          subtitle: 'Service health, database RPO freshness, and recovery chain validation',
        };
      case 'vault':
        return {
          title: 'Encrypted Credential Vault',
          subtitle: 'AES-256-GCM zero-leak secret storage for SSH keys, tokens, and database passwords',
        };
      case 'audit':
        return {
          title: 'Security & Operational Audit Trail',
          subtitle: 'Immutable compliance logging of administrative and destructive activities',
        };
      default:
        return { title: 'BackupOps Control Plane' };
    }
  };

  return (
    <div className="flex h-screen bg-[#090d16] text-zinc-100 font-sans selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
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
          {...getHeaderProps()}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onQuickAction={handleQuickAction}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* Server Detail Operational View */}
          {selectedServer && (
            <ServerDetailView
              server={selectedServer}
              onBack={() => setSelectedServer(null)}
              onSelectDatabase={(db) => {
                setSelectedServer(null);
                setSelectedDatabase(db);
                setActiveTab('databases');
              }}
            />
          )}

          {/* Database Detail Operational View */}
          {selectedDatabase && (
            <DatabaseDetailView
              database={selectedDatabase}
              onBack={() => setSelectedDatabase(null)}
              onTriggerBackup={(db) => handleTriggerBackupForDb(db)}
              onRestoreBackup={(b) => handleRestoreBackup(b)}
            />
          )}

          {/* Primary Tab Views (active when not inspecting detail) */}
          {!selectedServer && !selectedDatabase && (
            <>
              {activeTab === 'overview' && (
                <OverviewView
                  stats={stats}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onConnectCoolify={() => setActiveTab('coolify')}
                  onAddServer={() => setActiveTab('servers')}
                />
              )}

              {activeTab === 'coolify' && (
                <CoolifyView
                  connections={connections}
                  onRefresh={handleRefresh}
                  onNavigateToServer={handleNavigateToServer}
                />
              )}

              {activeTab === 'servers' && (
                <ServersView
                  servers={servers}
                  onRefresh={handleRefresh}
                  onSelectServer={(server) => setSelectedServer(server)}
                />
              )}

              {activeTab === 'docker' && <DockerView />}

              {activeTab === 'databases' && (
                <DatabasesView
                  databases={databases}
                  onRefresh={handleRefresh}
                  onSelectDatabase={(db) => setSelectedDatabase(db)}
                  onTriggerBackup={(db) => handleTriggerBackupForDb(db)}
                />
              )}

              {activeTab === 'storage' && (
                <StorageView
                  storageDestinations={storageDestinations}
                  onRefresh={handleRefresh}
                />
              )}

              {activeTab === 'backups' && (
                <BackupsView
                  backups={backups}
                  chains={chains}
                  databases={databases}
                  storageDestinations={storageDestinations}
                  policies={policies}
                  onRefresh={handleRefresh}
                  onRestore={(b) => handleRestoreBackup(b)}
                />
              )}

              {activeTab === 'restore' && (
                <RestoreView
                  restoreJobs={restoreJobs}
                  backups={backups}
                  databases={databases}
                  servers={servers}
                  onRefresh={handleRefresh}
                  preselectedBackup={preselectedRestoreBackup}
                />
              )}

              {activeTab === 'operations' && <OperationsView />}

              {activeTab === 'monitoring' && <MonitoringView />}

              {activeTab === 'vault' && <VaultView />}

              {activeTab === 'audit' && <AuditLogView />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
