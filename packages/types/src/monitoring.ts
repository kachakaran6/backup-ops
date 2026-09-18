export interface DashboardStats {
  infrastructure: {
    totalServers: number;
    onlineServers: number;
    offlineServers: number;
    coolifyInstances: number;
  };
  databases: {
    totalDatabases: number;
    healthyDatabases: number;
    backupOverdueDatabases: number;
    unprotectedDatabases: number;
  };
  backups: {
    last24hSuccessful: number;
    last24hFailed: number;
    activeOperations: number;
    totalArtifacts: number;
  };
  storage: {
    totalDestinations: number;
    usedCapacityBytes: number;
    availableCapacityBytes: number;
  };
  recovery: {
    validChains: number;
    brokenChains: number;
  };
}
