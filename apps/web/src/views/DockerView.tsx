import React, { useState, useEffect } from 'react';
import {
  Container,
  Server,
  RefreshCw,
  Box,
  FolderArchive,
  Info,
  Copy,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Server as ServerType } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { TableSkeleton, MetricCardsSkeleton } from '../components/common/Skeleton';

export const DockerView: React.FC = () => {
  const [servers, setServers] = useState<ServerType[]>([]);
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [dockerData, setDockerData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [inspecting, setInspecting] = useState<boolean>(false);

  const [replicateModal, setReplicateModal] = useState<{
    isOpen: boolean;
    volume: any | null;
    targetServerId: string;
    targetVolumeName: string;
    protocol: 'rsync' | 'archive';
    verifyChecksum: boolean;
    dryRun: boolean;
    submitting: boolean;
    successMessage: string | null;
  }>({
    isOpen: false,
    volume: null,
    targetServerId: '',
    targetVolumeName: '',
    protocol: 'rsync',
    verifyChecksum: true,
    dryRun: false,
    submitting: false,
    successMessage: null,
  });

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

  const handleOpenReplicate = (vol: any) => {
    const otherServers = servers.filter((s) => s.id !== selectedServerId);
    setReplicateModal({
      isOpen: true,
      volume: vol,
      targetServerId: otherServers[0]?.id || '',
      targetVolumeName: vol.name,
      protocol: 'rsync',
      verifyChecksum: true,
      dryRun: false,
      submitting: false,
      successMessage: null,
    });
  };

  const handleReplicateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replicateModal.volume || !replicateModal.targetServerId) return;

    setReplicateModal((prev) => ({ ...prev, submitting: true }));
    try {
      const job = await api.createJob({
        operationType: 'copy',
        sourceResourceId: selectedServer?.id || '',
        destinationResourceId: replicateModal.targetServerId,
        options: {
          sourceVolume: replicateModal.volume.name,
          destinationVolume: replicateModal.targetVolumeName || replicateModal.volume.name,
          protocol: replicateModal.protocol,
          verifyChecksum: replicateModal.verifyChecksum,
          dryRun: replicateModal.dryRun,
        },
      });

      setReplicateModal((prev) => ({
        ...prev,
        submitting: false,
        successMessage: `Replication job #${job?.id?.slice(0, 8) || 'COPY'} initiated successfully. Live stream progress is available in Operations.`,
      }));
    } catch (err: any) {
      alert('Failed to initiate volume replication: ' + err.message);
      setReplicateModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const selectedServer = servers.find((s) => s.id === selectedServerId);

  if (loading && servers.length === 0) {
    return (
      <div className="space-y-4 animate-in fade-in duration-150">
        <MetricCardsSkeleton count={4} />
        <TableSkeleton rows={4} columns={5} />
      </div>
    );
  }

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
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-[11px]">
                        {dockerData.volumes.map((v: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-hover transition-colors">
                            <td className="text-text-primary font-medium">{v.name}</td>
                            <td className="text-text-muted">{v.driver || 'local'}</td>
                            <td className="text-text-muted truncate max-w-xs">{v.mountpoint || '/var/lib/docker/volumes/...'}</td>
                            <td className="text-right font-sans">
                              <button
                                onClick={() => handleOpenReplicate(v)}
                                className="op-btn-secondary !text-[11px] !py-1 !px-2 flex items-center gap-1.5 ml-auto cursor-pointer"
                                title="Replicate volume to another server"
                              >
                                <Copy className="w-3 h-3 text-brand-primary" />
                                <span>Replicate</span>
                              </button>
                            </td>
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

      {/* Replicate Volume Modal */}
      {replicateModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-lg w-full p-5 space-y-4 shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-brand-primary" />
                <h3 className="font-semibold text-sm text-text-primary">
                  Replicate Volume to Target Server
                </h3>
              </div>
              <button
                onClick={() => setReplicateModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {replicateModal.successMessage ? (
              <div className="space-y-4 py-2">
                <div className="p-3.5 rounded-lg bg-success/10 border border-success/30 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-success block">Replication Dispatched</span>
                    <p className="text-text-secondary leading-relaxed">
                      {replicateModal.successMessage}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <a
                    href="/operations"
                    className="op-btn-primary flex items-center gap-1.5 !text-xs !py-1.5 !px-3"
                  >
                    <span>View Operations</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setReplicateModal((prev) => ({ ...prev, isOpen: false }))}
                    className="op-btn-secondary !text-xs !py-1.5 !px-3"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReplicateSubmit} className="space-y-3.5 text-xs">
                {/* Source details */}
                <div className="p-3 rounded bg-surface-secondary/50 border border-border space-y-1">
                  <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block">Source Volume</span>
                  <div className="font-mono text-xs text-text-primary font-medium flex items-center gap-2">
                    <FolderArchive className="w-3.5 h-3.5 text-text-muted" />
                    <span>{replicateModal.volume?.name}</span>
                    <span className="text-text-muted text-[11px]">on {selectedServer?.name} ({selectedServer?.host})</span>
                  </div>
                </div>

                {/* Target Server */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-text-secondary">Destination Server Host</label>
                  <select
                    value={replicateModal.targetServerId}
                    onChange={(e) => setReplicateModal((prev) => ({ ...prev, targetServerId: e.target.value }))}
                    className="op-input w-full"
                    required
                  >
                    <option value="" disabled>Select target server...</option>
                    {servers
                      .filter((s) => s.id !== selectedServerId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.host})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Target Volume Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-text-secondary">Destination Volume Name</label>
                  <input
                    type="text"
                    value={replicateModal.targetVolumeName}
                    onChange={(e) => setReplicateModal((prev) => ({ ...prev, targetVolumeName: e.target.value }))}
                    className="op-input w-full font-mono"
                    placeholder="Same as source volume name"
                    required
                  />
                  <span className="text-[10px] text-text-muted">Will be created or updated on the destination host.</span>
                </div>

                {/* Protocol */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-text-secondary">Transfer Protocol</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReplicateModal((prev) => ({ ...prev, protocol: 'rsync' }))}
                      className={`p-2.5 rounded text-left border transition-colors cursor-pointer ${
                        replicateModal.protocol === 'rsync'
                          ? 'bg-brand/10 border-brand-primary text-text-primary font-medium'
                          : 'bg-surface border-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <div className="font-semibold text-xs text-text-primary">Rsync Stream (Direct)</div>
                      <div className="text-[10px] text-text-muted mt-0.5">Encrypted SSH delta sync</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplicateModal((prev) => ({ ...prev, protocol: 'archive' }))}
                      className={`p-2.5 rounded text-left border transition-colors cursor-pointer ${
                        replicateModal.protocol === 'archive'
                          ? 'bg-brand/10 border-brand-primary text-text-primary font-medium'
                          : 'bg-surface border-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      <div className="font-semibold text-xs text-text-primary">Compressed Archive</div>
                      <div className="text-[10px] text-text-muted mt-0.5">Tar.gz snapshot & extract</div>
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-2 pt-1 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replicateModal.verifyChecksum}
                      onChange={(e) => setReplicateModal((prev) => ({ ...prev, verifyChecksum: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className="text-text-secondary text-xs">Verify SHA-256 integrity checksum after transfer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={replicateModal.dryRun}
                      onChange={(e) => setReplicateModal((prev) => ({ ...prev, dryRun: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className="text-text-secondary text-xs">Dry-run (simulate transfer without writing data)</span>
                  </label>
                </div>

                {/* Footer buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setReplicateModal((prev) => ({ ...prev, isOpen: false }))}
                    className="op-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={replicateModal.submitting || !replicateModal.targetServerId}
                    className="op-btn-primary flex items-center gap-1.5"
                  >
                    {replicateModal.submitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Initiating...</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Start Replication</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
