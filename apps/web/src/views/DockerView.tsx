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
import { StatusBadge } from '../components/common/StatusBadge';

export const DockerView: React.FC = () => {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [dockerData, setDockerData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [inspecting, setInspecting] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const serverList = await api.fetchServers();
        setServers(serverList);
        if (serverList.length > 0) {
          setSelectedServerId(serverList[0].id);
          await inspectDocker(serverList[0].id);
        }
      } catch (err) {
        console.error('Failed to load server list:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const inspectDocker = async (serverId: string) => {
    setInspecting(true);
    try {
      const data = await api.fetchServerDocker(serverId);
      setDockerData(data);
    } catch (err) {
      console.error('Failed to inspect Docker daemon:', err);
    } finally {
      setInspecting(false);
    }
  };

  const handleSelectServer = async (serverId: string) => {
    setSelectedServerId(serverId);
    await inspectDocker(serverId);
  };

  const selectedServer = servers.find((s) => s.id === selectedServerId);

  return (
    <div className="space-y-4">

      {/* Architectural Notice */}
      <div className="op-card p-3.5 flex items-start gap-3 border-l-2 border-l-brand-primary">
        <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <div className="text-xs space-y-0.5">
          <span className="font-semibold text-text-primary">
            Architectural Principle: Raw Volume Backups ≠ Database Backups
          </span>
          <p className="text-text-muted leading-relaxed text-[11px]">
            Backing up raw Docker storage volumes while database engines are active creates crash-inconsistent states.
            For PostgreSQL, MySQL, and MariaDB, always orchestrate through our dedicated{' '}
            <strong className="text-brand-primary">Database Workload Engine</strong> (Base + WAL PITR or logical dumps).
            Docker volume operations are reserved for stateless uploads and configuration directories.
          </p>
        </div>
      </div>

      {/* Server Selector */}
      {servers.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No servers connected"
          description="Connect a server via Coolify discovery or direct SSH to discover running Docker daemon instances."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider shrink-0">
              Host Target:
            </span>
            {servers.map((srv) => (
              <button
                key={srv.id}
                onClick={() => handleSelectServer(srv.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0 border cursor-pointer ${
                  selectedServerId === srv.id
                    ? 'bg-surface-elevated text-brand-primary border-brand-primary/40 font-semibold'
                    : 'bg-surface text-text-muted hover:text-text-primary border-border'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>{srv.name}</span>
                <span className="text-[10px] font-mono text-text-muted">({srv.host})</span>
              </button>
            ))}
          </div>

          {inspecting ? (
            <div className="op-card p-12 text-center text-text-muted text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
              <span>Querying Docker daemon on {selectedServer?.name || 'host'}...</span>
            </div>
          ) : dockerData ? (
            <div className="space-y-3">
              {/* Daemon Status Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="op-card p-2.5">
                  <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Daemon Status</div>
                  <div className="mt-1.5">
                    <StatusBadge
                      status={dockerData.running ? 'HEALTHY' : 'OFFLINE'}
                      size="sm"
                    />
                  </div>
                  <div className="text-[10px] font-mono text-text-muted mt-1">Docker socket active</div>
                </div>

                <div className="op-card p-2.5">
                  <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Containers</div>
                  <div className="mt-1 text-lg font-semibold text-text-primary font-mono">
                    {dockerData.containers ? dockerData.containers.length : 0}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">Active containers</div>
                </div>

                <div className="op-card p-2.5">
                  <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Named Volumes</div>
                  <div className="mt-1 text-lg font-semibold text-text-primary font-mono">
                    {dockerData.volumes ? dockerData.volumes.length : 0}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">Persistent mounts</div>
                </div>

                <div className="op-card p-2.5">
                  <div className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Database Workloads</div>
                  <div className="mt-1 text-lg font-semibold text-text-primary font-mono">
                    {dockerData.containers
                      ? dockerData.containers.filter((c: any) =>
                          c.image?.includes('postgres') || c.image?.includes('mysql') || c.image?.includes('mariadb')
                        ).length
                      : 0}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">Identified DB engines</div>
                </div>
              </div>

              {/* Containers Table */}
              <div className="op-card overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-text-muted" />
                    <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wider">
                      Running Containers ({dockerData.containers?.length || 0})
                    </h3>
                  </div>
                  <button
                    onClick={() => inspectDocker(selectedServerId)}
                    className="op-btn-ghost !py-1 !px-2 text-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-scan</span>
                  </button>
                </div>

                {dockerData.containers && dockerData.containers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="op-table">
                      <thead>
                        <tr>
                          <th>Container</th>
                          <th>Image</th>
                          <th>Ports</th>
                          <th>Status</th>
                          <th>Workload Classifier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dockerData.containers.map((c: any, idx: number) => {
                          const isDb =
                            c.image?.includes('postgres') || c.image?.includes('mysql') || c.image?.includes('mariadb');
                          return (
                            <tr key={idx} className="hover:bg-surface-hover transition-colors font-mono">
                              <td className="font-medium text-text-primary flex items-center gap-2">
                                <Container className="w-3.5 h-3.5 text-text-muted" />
                                <span>{c.name || c.id}</span>
                              </td>
                              <td className="text-[11px] text-text-secondary truncate max-w-xs">{c.image}</td>
                              <td className="text-[11px] text-text-muted">{c.ports || '-'}</td>
                              <td>
                                <StatusBadge
                                  status={c.status?.toLowerCase().includes('up') ? 'HEALTHY' : 'OFFLINE'}
                                  size="sm"
                                />
                              </td>
                              <td className="font-sans">
                                {isDb ? (
                                  <span className="text-brand-primary text-[11px] font-semibold">
                                    Database Engine (Use DB Protection)
                                  </span>
                                ) : (
                                  <span className="text-text-muted text-[11px]">Application Runtime</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-text-muted text-xs">
                    No active containers reported by Docker daemon on this host.
                  </div>
                )}
              </div>

              {/* Volumes Table */}
              <div className="op-card overflow-hidden">
                <div className="p-3 border-b border-border flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-text-muted" />
                  <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wider">
                    Docker Named Volumes ({dockerData.volumes?.length || 0})
                  </h3>
                </div>
                {dockerData.volumes && dockerData.volumes.length > 0 ? (
                  <div className="overflow-x-auto">
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
                          <tr key={idx} className="hover:bg-surface-hover transition-colors">
                            <td className="text-text-primary font-medium">{v.name}</td>
                            <td className="text-text-muted">{v.driver || 'local'}</td>
                            <td className="text-text-muted truncate max-w-xs">{v.mountpoint || '/var/lib/docker/volumes/...'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-text-muted text-xs">
                    No Docker persistent volumes found on this server host.
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
