import React, { useState, useEffect } from 'react';
import {
  Container,
  Server,
  RefreshCw,
  Box,
  FolderArchive,
  Info,
} from 'lucide-react';
import { Server as ServerType } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { StatusIndicator } from '../components/common/StatusIndicator';

export const DockerView: React.FC = () => {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [dockerData, setDockerData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [inspecting, setInspecting] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const serverList = await api.fetchServers();
      setServers(serverList);
      if (serverList.length > 0) {
        setSelectedServerId(serverList[0].id);
        await inspectDocker(serverList[0].id);
      }
      setLoading(false);
    };
    init();
  }, []);

  const inspectDocker = async (serverId: string) => {
    setInspecting(true);
    const data = await api.fetchServerDocker(serverId);
    setDockerData(data);
    setInspecting(false);
  };

  const handleSelectServer = async (serverId: string) => {
    setSelectedServerId(serverId);
    await inspectDocker(serverId);
  };

  const selectedServer = servers.find((s) => s.id === selectedServerId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-sm sm:text-base font-semibold text-text-primary flex items-center gap-2">
          <Container className="w-4 h-4 text-text-muted" />
          Docker Infrastructure &amp; Volume Awareness
        </h1>
        <p className="text-xs text-text-muted mt-0.5">
          Detect and inspect containerized runtimes and volumes across all managed servers.
        </p>
      </div>

      {/* Architectural Notice */}
      <div className="op-card p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-semibold text-text-primary">
            Architectural Principle: Docker Volume Backups ≠ Database Backups
          </span>
          <p className="text-text-muted leading-relaxed">
            Backing up raw Docker storage volumes (e.g. <code className="text-text-secondary font-mono">/var/lib/docker/volumes/...</code>)
            while a database engine is running produces crash-inconsistent files. For PostgreSQL, MySQL, and MariaDB, always orchestrate through our dedicated{' '}
            <strong className="text-text-primary">Databases Engine</strong> (Base + WAL archiving / PITR or logical dump).
            Docker volume operations are intended for stateless uploads and configuration assets.
          </p>
        </div>
      </div>

      {/* Server Selector */}
      {servers.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No Servers Connected"
          description="Connect a server via Coolify discovery or direct SSH to discover running Docker daemon instances."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider shrink-0">
              Host:
            </span>
            {servers.map((srv) => (
              <button
                key={srv.id}
                onClick={() => handleSelectServer(srv.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 border cursor-pointer ${
                  selectedServerId === srv.id
                    ? 'bg-surface-elevated text-text-primary border-border-strong'
                    : 'bg-surface text-text-muted hover:text-text-secondary border-border'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>{srv.name}</span>
                <span className="text-[10px] font-mono text-text-muted">({srv.host})</span>
              </button>
            ))}
          </div>

          {inspecting ? (
            <div className="p-12 text-center text-text-muted text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-accent" />
              <span>Querying Docker daemon on {selectedServer?.name}...</span>
            </div>
          ) : dockerData ? (
            <div className="space-y-4">
              {/* Daemon Status Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-lg op-card">
                  <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Daemon Status</div>
                  <div className="mt-2">
                    <StatusIndicator
                      status={dockerData.running ? 'online' : 'offline'}
                      label={dockerData.running ? 'Active & Running' : 'Not Detected'}
                      variant="inline"
                    />
                  </div>
                  <div className="text-[10px] text-text-muted mt-1">Docker socket online</div>
                </div>

                <div className="p-3.5 rounded-lg op-card">
                  <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Containers</div>
                  <div className="mt-1 text-xl font-semibold text-text-primary font-mono">
                    {dockerData.containers ? dockerData.containers.length : 0}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">Discovered containers</div>
                </div>

                <div className="p-3.5 rounded-lg op-card">
                  <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Named Volumes</div>
                  <div className="mt-1 text-xl font-semibold text-text-primary font-mono">
                    {dockerData.volumes ? dockerData.volumes.length : 0}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">Persistent volumes</div>
                </div>

                <div className="p-3.5 rounded-lg op-card">
                  <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">DB Workloads</div>
                  <div className="mt-1 text-xl font-semibold text-text-primary font-mono">
                    {dockerData.containers
                      ? dockerData.containers.filter((c: any) =>
                          c.image?.includes('postgres') || c.image?.includes('mysql') || c.image?.includes('mariadb')
                        ).length
                      : 0}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">Database containers</div>
                </div>
              </div>

              {/* Containers List */}
              <div className="rounded-lg border border-border bg-surface overflow-x-auto">
                <div className="p-3.5 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-text-muted" />
                    <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wider">Discovered Containers</h3>
                  </div>
                  <button
                    onClick={() => inspectDocker(selectedServerId)}
                    className="op-btn-ghost !py-1 !px-2 text-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh</span>
                  </button>
                </div>

                {dockerData.containers && dockerData.containers.length > 0 ? (
                  <table className="op-table">
                    <thead>
                      <tr>
                        <th>Container Name</th>
                        <th>Image</th>
                        <th>Status</th>
                        <th>Type Detection</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dockerData.containers.map((c: any, idx: number) => {
                        const isDb =
                          c.image?.includes('postgres') || c.image?.includes('mysql') || c.image?.includes('mariadb');
                        return (
                          <tr key={idx}>
                            <td className="font-medium text-text-primary flex items-center gap-2">
                              <Container className="w-3.5 h-3.5 text-text-muted" />
                              <span>{c.name || c.id}</span>
                            </td>
                            <td className="font-mono text-[11px] text-text-secondary">{c.image}</td>
                            <td>
                              <StatusIndicator status={c.status} variant="inline" />
                            </td>
                            <td>
                              {isDb ? (
                                <span className="text-accent text-[11px] font-medium">
                                  Database Engine (Use DB Protection)
                                </span>
                              ) : (
                                <span className="text-text-muted text-[11px]">Application Service</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-text-muted text-xs">
                    No active containers reported by Docker daemon on this host.
                  </div>
                )}
              </div>

              {/* Volumes List */}
              <div className="rounded-lg border border-border bg-surface overflow-x-auto">
                <div className="p-3.5 border-b border-border flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-text-muted" />
                  <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wider">Docker Volumes</h3>
                </div>
                {dockerData.volumes && dockerData.volumes.length > 0 ? (
                  <table className="op-table">
                    <thead>
                      <tr>
                        <th>Volume Name</th>
                        <th>Driver</th>
                        <th>Mountpoint</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[11px]">
                      {dockerData.volumes.map((v: any, idx: number) => (
                        <tr key={idx}>
                          <td className="text-text-primary font-medium">{v.name}</td>
                          <td className="text-text-muted">{v.driver || 'local'}</td>
                          <td className="text-text-muted truncate max-w-xs">{v.mountpoint || '/var/lib/docker/volumes/...'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-text-muted text-xs">
                    No Docker persistent volumes found on this server.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
