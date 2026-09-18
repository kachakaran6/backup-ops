import React, { useState, useEffect } from 'react';
import {
  Container,
  Server,
  HardDrive,
  Database,
  Layers,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Box,
  FolderArchive,
  Info,
} from 'lucide-react';
import { Server as ServerType } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';

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
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Container className="w-5 h-5 text-blue-400" />
          Docker Infrastructure & Volume Awareness
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Detect and inspect containerized runtimes and volumes across all managed servers.
        </p>
      </div>

      {/* Architectural Notice: Docker Volume vs Database Backups */}
      <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-semibold text-blue-300">
            Architectural Principle: Docker Volume Backups ≠ Database Backups
          </span>
          <p className="text-zinc-400 leading-relaxed">
            Backing up raw Docker storage volumes (e.g., <code className="text-zinc-300">/var/lib/docker/volumes/...</code>)
            while a database engine is running produces crash-inconsistent files that may cause silent corruption.
            For PostgreSQL, MySQL, and MariaDB, always orchestrate through our dedicated{' '}
            <strong className="text-zinc-300">Databases Engine</strong> (Base + WAL archiving / PITR or logical pg_dump).
            Docker volume operations should be reserved for stateless storage, media uploads, and configuration volumes.
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
        <div className="space-y-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider shrink-0">
              Select Host:
            </span>
            {servers.map((srv) => (
              <button
                key={srv.id}
                onClick={() => handleSelectServer(srv.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                  selectedServerId === srv.id
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>{srv.name}</span>
                <span className="text-[10px] font-mono opacity-70">({srv.host})</span>
              </button>
            ))}
          </div>

          {inspecting ? (
            <div className="p-12 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span>Querying Docker daemon on {selectedServer?.name}...</span>
            </div>
          ) : dockerData ? (
            <div className="space-y-6">
              {/* Daemon Status Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Daemon Status</div>
                  <div className="mt-2 flex items-center gap-2">
                    {dockerData.running ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Active & Running
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-zinc-400 font-medium text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-400" /> Not Detected
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Docker socket available</div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Containers</div>
                  <div className="mt-2 text-2xl font-bold text-zinc-100 font-mono">
                    {dockerData.containers ? dockerData.containers.length : 0}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Managed containers</div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Named Volumes</div>
                  <div className="mt-2 text-2xl font-bold text-zinc-100 font-mono">
                    {dockerData.volumes ? dockerData.volumes.length : 0}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Local persistent volumes</div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Database Workloads</div>
                  <div className="mt-2 text-2xl font-bold text-blue-400 font-mono">
                    {dockerData.containers
                      ? dockerData.containers.filter((c: any) =>
                          c.image?.includes('postgres') || c.image?.includes('mysql') || c.image?.includes('mariadb')
                        ).length
                      : 0}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Detected database containers</div>
                </div>
              </div>

              {/* Containers List */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-sm text-zinc-100">Discovered Containers</h3>
                  </div>
                  <button
                    onClick={() => inspectDocker(selectedServerId)}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>

                {dockerData.containers && dockerData.containers.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                      <tr>
                        <th className="px-5 py-3">Container Name</th>
                        <th className="px-5 py-3">Image</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Type Detection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                      {dockerData.containers.map((c: any, idx: number) => {
                        const isDb =
                          c.image?.includes('postgres') || c.image?.includes('mysql') || c.image?.includes('mariadb');
                        return (
                          <tr key={idx} className="hover:bg-zinc-900/40 transition">
                            <td className="px-5 py-3.5 font-medium text-zinc-200 flex items-center gap-2">
                              <Container className="w-3.5 h-3.5 text-zinc-400" />
                              <span>{c.name || c.id}</span>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-400">{c.image}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {c.status || 'RUNNING'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {isDb ? (
                                <span className="flex items-center gap-1 text-blue-400 text-[11px] font-semibold">
                                  <Database className="w-3.5 h-3.5" /> Database Engine (Use DB Protection)
                                </span>
                              ) : (
                                <span className="text-zinc-400 text-[11px]">Application Service</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-zinc-400 text-xs">
                    No active containers reported by Docker daemon on this host.
                  </div>
                )}
              </div>

              {/* Volumes List */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-semibold text-sm text-zinc-100">Docker Volumes</h3>
                </div>
                {dockerData.volumes && dockerData.volumes.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                      <tr>
                        <th className="px-5 py-3">Volume Name</th>
                        <th className="px-5 py-3">Driver</th>
                        <th className="px-5 py-3">Mountpoint</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 text-zinc-300 font-mono text-[11px]">
                      {dockerData.volumes.map((v: any, idx: number) => (
                        <tr key={idx} className="hover:bg-zinc-900/40 transition">
                          <td className="px-5 py-3.5 text-zinc-200">{v.name}</td>
                          <td className="px-5 py-3.5 text-zinc-400">{v.driver || 'local'}</td>
                          <td className="px-5 py-3.5 text-zinc-400 truncate max-w-xs">{v.mountpoint || '/var/lib/docker/volumes/...'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-zinc-400 text-xs">
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
