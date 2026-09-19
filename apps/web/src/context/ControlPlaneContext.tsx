import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Server,
  Database,
  StorageDestination,
  CoolifyConnection,
  Backup,
  BackupChain,
  Policy,
  RestoreJob,
  DashboardStats,
} from '../types';
import * as api from '../services/api';
import { useAuth } from './AuthContext';

interface ControlPlaneContextType {
  stats: DashboardStats;
  connections: CoolifyConnection[];
  servers: Server[];
  databases: Database[];
  storageDestinations: StorageDestination[];
  backups: Backup[];
  chains: BackupChain[];
  policies: Policy[];
  restoreJobs: RestoreJob[];
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
}

const ControlPlaneContext = createContext<ControlPlaneContextType | undefined>(undefined);

export const ControlPlaneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    infrastructure: { totalServers: 0, onlineServers: 0, offlineServers: 0, coolifyInstances: 0 },
    databases: { totalDatabases: 0, healthyDatabases: 0, backupOverdueDatabases: 0, unprotectedDatabases: 0 },
    backups: { last24hSuccessful: 0, last24hFailed: 0, activeOperations: 0, totalArtifacts: 0 },
    storage: { totalDestinations: 0, usedCapacityBytes: 0, availableCapacityBytes: 0 },
    recovery: { validChains: 0, brokenChains: 0 },
  });
  const [connections, setConnections] = useState<CoolifyConnection[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [storageDestinations, setStorageDestinations] = useState<StorageDestination[]>([]);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [chains, setChains] = useState<BackupChain[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [restoreJobs, setRestoreJobs] = useState<RestoreJob[]>([]);

  const loadAllData = useCallback(async () => {
    if (!isAuthenticated) return;

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
    } catch (err) {
      console.error('Failed to load control plane state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
      const interval = setInterval(loadAllData, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, loadAllData]);

  const refresh = async () => {
    setIsRefreshing(true);
    await loadAllData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <ControlPlaneContext.Provider
      value={{
        stats,
        connections,
        servers,
        databases,
        storageDestinations,
        backups,
        chains,
        policies,
        restoreJobs,
        isLoading,
        isRefreshing,
        refresh,
      }}
    >
      {children}
    </ControlPlaneContext.Provider>
  );
};

export function useControlPlane(): ControlPlaneContextType {
  const context = useContext(ControlPlaneContext);
  if (!context) {
    throw new Error('useControlPlane must be used within a ControlPlaneProvider');
  }
  return context;
}
