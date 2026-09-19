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
  Plus,
  Check,
  ExternalLink,
  Terminal,
  Cloud,
  BookOpen,
} from 'lucide-react';
import { Server as ServerType } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { TableSkeleton, MetricCardsSkeleton } from '../components/common/Skeleton';
import { Select } from '../components/common/Select';
import { useNavigate } from 'react-router-dom';

export const DockerView: React.FC = () => {
  const navigate = useNavigate();
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
    protocol: string;
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

  const [coolifyGuideModal, setCoolifyGuideModal] = useState<{
    isOpen: boolean;
    volume: any | null;
    serverName: string;
    serverIp: string;
    copiedField: string | null;
  }>({
    isOpen: false,
    volume: null,
    serverName: '',
    serverIp: '',
    copiedField: null,
  });

  const [addVolumeModal, setAddVolumeModal] = useState<{
    isOpen: boolean;
    name: string;
    project: string;
    mountpoint: string;
    driver: string;
    submitting: boolean;
  }>({
    isOpen: false,
    name: '',
    project: 'testing-project',
    mountpoint: '',
    driver: 'local',
    submitting: false,
  });

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCoolifyGuideModal((prev) => ({ ...prev, copiedField: fieldId }));
    setTimeout(() => {
      setCoolifyGuideModal((prev) => ({ ...prev, copiedField: null }));
    }, 2000);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '128.0 MB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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

  const handleAddVolumeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addVolumeModal.name.trim()) return;
    setAddVolumeModal((prev) => ({ ...prev, submitting: true }));
    try {
      await api.addServerVolume(selectedServerId, {
        name: addVolumeModal.name.trim(),
        project: addVolumeModal.project.trim() || 'testing-project',
        mountpoint: addVolumeModal.mountpoint.trim() || `/var/lib/docker/volumes/${addVolumeModal.name.trim()}/_data`,
        driver: addVolumeModal.driver,
      });
      setAddVolumeModal({
        isOpen: false,
        name: '',
        project: 'testing-project',
        mountpoint: '',
        driver: 'local',
        submitting: false,
      });
      await inspectDocker(selectedServerId);
    } catch (err: any) {
      console.error('Failed to add volume:', err);
    } finally {
      setAddVolumeModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleReplicateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replicateModal.volume || !replicateModal.targetServerId) {
      alert('Please select a volume and a destination server.');
      return;
    }
    if (!selectedServerId) {
      alert('Source server not identified. Please select a server first.');
      return;
    }

    setReplicateModal((prev) => ({ ...prev, submitting: true }));
    try {
      const sourceServer = servers.find((s) => s.id === selectedServerId);
      const targetServer = servers.find((s) => s.id === replicateModal.targetServerId);

      const job = await api.createJob({
        operationType: 'copy',
        sourceResourceId: selectedServerId,
        destinationResourceId: replicateModal.targetServerId,
        options: {
          volumeName: replicateModal.volume.name,
          targetVolumeName: replicateModal.targetVolumeName.trim() || replicateModal.volume.name,
          sourceVolume: replicateModal.volume.name,
          destinationVolume: replicateModal.targetVolumeName.trim() || replicateModal.volume.name,
          transferProtocol: replicateModal.protocol,
          protocol: replicateModal.protocol,
          sourceServer: sourceServer?.name || 'source',
          targetServer: targetServer?.name || 'target',
          verifyChecksum: replicateModal.verifyChecksum,
          dryRun: replicateModal.dryRun,
        },
      });

      setReplicateModal((prev) => ({
        ...prev,
        submitting: false,
        successMessage: `Replication job #${job.id.slice(0, 8)} initiated successfully. Live stream progress is available in Operations.`,
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

              {/* Coolify Operational Guide Banner */}
              <div className="op-card p-3 flex items-start gap-3 border-l-2 border-l-info/70 bg-surface-secondary/40">
                <Cloud className="w-4 h-4 text-info shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">
                      Where are these volumes in Coolify?
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-info/10 text-info border border-info/20">
                      Host Mount: /var/lib/docker/volumes/...
                    </span>
                  </div>
                  <p className="text-text-muted leading-relaxed text-[11px]">
                    Volumes replicated or created here exist directly in Docker Engine on this host. In Coolify, volumes only show inside an application once attached. To attach any volume in Coolify: open your <strong>Application / Service in Coolify</strong> &rarr; go to <strong>Storages tab</strong> &rarr; click <strong>+ Add Persistent Storage</strong> with the Volume Name. Click the <strong>Coolify Guide</strong> button on any volume below for exact copy-paste steps!
                  </p>
                </div>
              </div>

              {/* Volumes Table */}
              <div className="op-card overflow-hidden">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderArchive className="w-4 h-4 text-text-muted" />
                    <h3 className="font-semibold text-xs text-text-primary uppercase tracking-wider">
                      Docker Named Volumes ({dockerData.volumes?.length || 0})
                    </h3>
                  </div>
                  <button
                    onClick={() => setAddVolumeModal((prev) => ({ ...prev, isOpen: true }))}
                    className="op-btn-secondary !text-xs !py-1 !px-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-brand-primary" />
                    <span>Add Volume</span>
                  </button>
                </div>
                {dockerData.volumes && dockerData.volumes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="op-table">
                      <thead>
                        <tr>
                          <th>Volume Name</th>
                          <th>Project / Scope</th>
                          <th>Size</th>
                          <th>Driver</th>
                          <th>Mountpoint</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-[11px]">
                        {dockerData.volumes.map((v: any, idx: number) => (
                          <tr key={idx} className="hover:bg-surface-hover transition-colors">
                            <td className="text-text-primary font-medium">{v.name}</td>
                            <td className="font-sans">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-elevated text-text-secondary border border-border">
                                {v.project || 'system'}
                              </span>
                            </td>
                            <td className="text-text-primary font-mono font-medium">
                              {formatBytes(v.sizeBytes)}
                            </td>
                            <td className="text-text-muted">{v.driver || 'local'}</td>
                            <td className="text-text-muted truncate max-w-xs">{v.mountpoint || '/var/lib/docker/volumes/...'}</td>
                            <td className="text-right font-sans">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() =>
                                    setCoolifyGuideModal({
                                      isOpen: true,
                                      volume: v,
                                      serverName: selectedServer?.name || 'target-server',
                                      serverIp: selectedServer?.host || '',
                                      copiedField: null,
                                    })
                                  }
                                  className="op-btn-secondary !text-[11px] !py-1 !px-2 flex items-center gap-1 cursor-pointer text-text-secondary hover:text-text-primary"
                                  title="How to see and mount this volume in Coolify"
                                >
                                  <ExternalLink className="w-3 h-3 text-info" />
                                  <span>Coolify Guide</span>
                                </button>
                                <button
                                  onClick={() => handleOpenReplicate(v)}
                                  className="op-btn-secondary !text-[11px] !py-1 !px-2 flex items-center gap-1.5 cursor-pointer"
                                  title="Replicate volume to another server"
                                >
                                  <Copy className="w-3 h-3 text-brand-primary" />
                                  <span>Replicate</span>
                                </button>
                              </div>
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
                  <button
                    type="button"
                    onClick={() => {
                      const targetServer = servers.find((s) => s.id === replicateModal.targetServerId);
                      const volName = replicateModal.targetVolumeName.trim() || replicateModal.volume?.name;
                      setReplicateModal((prev) => ({ ...prev, isOpen: false }));
                      setCoolifyGuideModal({
                        isOpen: true,
                        volume: {
                          name: volName,
                          mountpoint: `/var/lib/docker/volumes/${volName}/_data`,
                          driver: 'local',
                        },
                        serverName: targetServer?.name || 'target-server',
                        serverIp: targetServer?.host || '',
                        copiedField: null,
                      });
                    }}
                    className="op-btn-secondary flex items-center gap-1.5 !text-xs !py-1.5 !px-3"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-info" />
                    <span>How to Mount in Coolify</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplicateModal((prev) => ({ ...prev, isOpen: false }));
                      navigate('/operations');
                    }}
                    className="op-btn-primary flex items-center gap-1.5 !text-xs !py-1.5 !px-3"
                  >
                    <span>View in Operations</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
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
                  <Select
                    value={replicateModal.targetServerId}
                    onValueChange={(val) => setReplicateModal((prev) => ({ ...prev, targetServerId: val }))}
                    placeholder="Select destination server..."
                    options={servers
                      .filter((s) => s.id !== selectedServerId)
                      .map((s) => ({
                        value: s.id,
                        label: s.name,
                        sublabel: s.host,
                        icon: Server,
                      }))}
                  />
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
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-text-secondary">Transfer Protocol</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setReplicateModal((prev) => ({ ...prev, protocol: 'rsync' }))}
                      className={`relative p-3 rounded-lg text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        replicateModal.protocol === 'rsync'
                          ? 'bg-brand/10 border-brand ring-1 ring-brand shadow-xs'
                          : 'bg-surface border-border text-text-muted hover:border-border-strong hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="font-semibold text-xs text-text-primary">
                          Rsync Stream (Direct)
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            replicateModal.protocol === 'rsync'
                              ? 'border-brand bg-brand text-white'
                              : 'border-border bg-surface'
                          }`}
                        >
                          {replicateModal.protocol === 'rsync' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="text-[10px] text-text-muted">Encrypted SSH delta sync</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReplicateModal((prev) => ({ ...prev, protocol: 'archive' }))}
                      className={`relative p-3 rounded-lg text-left border transition-all cursor-pointer flex flex-col justify-between ${
                        replicateModal.protocol === 'archive'
                          ? 'bg-brand/10 border-brand ring-1 ring-brand shadow-xs'
                          : 'bg-surface border-border text-text-muted hover:border-border-strong hover:bg-surface-hover'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="font-semibold text-xs text-text-primary">
                          Compressed Archive
                        </div>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            replicateModal.protocol === 'archive'
                              ? 'border-brand bg-brand text-white'
                              : 'border-border bg-surface'
                          }`}
                        >
                          {replicateModal.protocol === 'archive' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="text-[10px] text-text-muted">Tar.gz snapshot & extract</div>
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

      {/* Add Volume Modal */}
      {addVolumeModal.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-md w-full p-5 space-y-4 shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-brand-primary" />
                <h3 className="font-semibold text-sm text-text-primary">
                  Add Testing Volume to Server
                </h3>
              </div>
              <button
                onClick={() => setAddVolumeModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddVolumeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Volume Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. test_project_volume"
                  value={addVolumeModal.name}
                  onChange={(e) => setAddVolumeModal((prev) => ({ ...prev, name: e.target.value }))}
                  className="op-input w-full font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Project / Scope
                </label>
                <input
                  type="text"
                  placeholder="e.g. testing-project"
                  value={addVolumeModal.project}
                  onChange={(e) => setAddVolumeModal((prev) => ({ ...prev, project: e.target.value }))}
                  className="op-input w-full font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Mountpoint (Host or Container)
                </label>
                <input
                  type="text"
                  placeholder="/var/lib/docker/volumes/... or /data"
                  value={addVolumeModal.mountpoint}
                  onChange={(e) => setAddVolumeModal((prev) => ({ ...prev, mountpoint: e.target.value }))}
                  className="op-input w-full font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAddVolumeModal((prev) => ({ ...prev, isOpen: false }))}
                  className="op-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addVolumeModal.submitting || !addVolumeModal.name.trim()}
                  className="op-btn-primary flex items-center gap-1.5"
                >
                  {addVolumeModal.submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach Volume</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coolify Mount & Inspection Guide Modal */}
      {coolifyGuideModal.isOpen && coolifyGuideModal.volume && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="op-card-elevated max-w-2xl w-full p-5 space-y-4 shadow-2xl border-border animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-info/10 border border-info/30 flex items-center justify-center text-info">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-text-primary">
                    How to See & Mount this Volume in Coolify
                  </h3>
                  <p className="text-[11px] font-mono text-text-muted">
                    Volume: <strong className="text-brand-primary">{coolifyGuideModal.volume.name}</strong> on host <strong className="text-text-primary">{coolifyGuideModal.serverName}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCoolifyGuideModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Summary Alert */}
            <div className="p-3.5 rounded-lg bg-info/10 border border-info/20 text-xs space-y-1">
              <span className="font-semibold text-info block flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Why isn't this volume listed in Coolify's web UI yet?
              </span>
              <p className="text-text-secondary text-[11px] leading-relaxed">
                Coolify tracks volumes on a <strong>per-application</strong> basis. When a volume is replicated or created in BackupOps, it is created directly on the host server's Docker daemon at <code className="text-brand-primary font-mono font-semibold">/var/lib/docker/volumes/{coolifyGuideModal.volume.name}/_data</code>. To attach it and see it in your Coolify apps, follow the 3 quick steps below:
              </p>
            </div>

            {/* Guide Steps */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
                <span>Step-by-Step: Mount in Coolify Web Dashboard</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-1.5">
                  <div className="flex items-center gap-2 font-medium text-text-primary">
                    <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Open Coolify and select server <strong className="text-brand-primary font-mono">{coolifyGuideModal.serverName}</strong>.</span>
                  </div>
                  <p className="text-text-muted text-[11px] pl-7">
                    Open your <strong>Project</strong>, and click on the target <strong>Application</strong> or <strong>Service</strong> where you want to attach this volume.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-2">
                  <div className="flex items-center gap-2 font-medium text-text-primary">
                    <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Go to the <strong>Storages</strong> tab &rarr; click <strong>+ Add Persistent Storage</strong>.</span>
                  </div>
                  <div className="pl-7 space-y-2">
                    <div className="p-2.5 rounded bg-surface border border-border font-mono text-[11px] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted">Volume Name:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-brand-primary font-bold">{coolifyGuideModal.volume.name}</code>
                          <button
                            onClick={() => handleCopy(coolifyGuideModal.volume.name, 'volName')}
                            className="op-btn-secondary !p-1 !text-[10px] flex items-center gap-1 cursor-pointer"
                            title="Copy volume name"
                          >
                            {coolifyGuideModal.copiedField === 'volName' ? (
                              <Check className="w-3 h-3 text-success" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
                        <span className="text-text-muted">Destination Path (in Container):</span>
                        <code className="text-text-secondary">/data (or /app/uploads)</code>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-1.5">
                  <div className="flex items-center gap-2 font-medium text-text-primary">
                    <span className="w-5 h-5 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Click <strong>Save</strong> and <strong>Redeploy</strong>.</span>
                  </div>
                  <p className="text-text-muted text-[11px] pl-7">
                    Coolify starts the container mounted with the replicated data immediately!
                  </p>
                </div>
              </div>
            </div>

            {/* Terminal CLI Verification */}
            <div className="space-y-2 pt-2 border-t border-border">
              <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-text-muted" />
                <span>Verify directly on Host Server (SSH / Terminal)</span>
              </h4>

              <div className="p-2.5 rounded-lg bg-black/60 border border-border font-mono text-[11px] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate text-text-secondary">
                    <span className="text-brand-primary">$</span>
                    <span className="truncate">docker volume inspect {coolifyGuideModal.volume.name}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`docker volume inspect ${coolifyGuideModal.volume.name}`, 'cliInspect')}
                    className="op-btn-ghost !p-1 text-text-muted hover:text-text-primary shrink-0 cursor-pointer"
                    title="Copy command"
                  >
                    {coolifyGuideModal.copiedField === 'cliInspect' ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
                  <div className="flex items-center gap-2 truncate text-text-secondary">
                    <span className="text-brand-primary">$</span>
                    <span className="truncate">ls -la /var/lib/docker/volumes/{coolifyGuideModal.volume.name}/_data</span>
                  </div>
                  <button
                    onClick={() => handleCopy(`ls -la /var/lib/docker/volumes/${coolifyGuideModal.volume.name}/_data`, 'cliLs')}
                    className="op-btn-ghost !p-1 text-text-muted hover:text-text-primary shrink-0 cursor-pointer"
                    title="Copy command"
                  >
                    {coolifyGuideModal.copiedField === 'cliLs' ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setCoolifyGuideModal((prev) => ({ ...prev, isOpen: false }))}
                className="op-btn-primary !text-xs !py-1.5 !px-3 cursor-pointer"
              >
                Got It, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
