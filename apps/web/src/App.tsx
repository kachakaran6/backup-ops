import React, { useState, useEffect } from 'react';
import {
  Database,
  HardDrive,
  Server,
  Activity,
  ShieldCheck,
  Play,
  RotateCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings,
  FileText,
  Key,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  X,
  RefreshCw,
  Sliders,
  Check,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Resource, Job, Policy, Credential, AuditLog } from './types';
import * as api from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'jobs' | 'policies' | 'vault' | 'audit' | 'settings'>('overview');
  const [resources, setResources] = useState<Resource[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showAddResource, setShowAddResource] = useState(false);
  const [showTriggerJob, setShowTriggerJob] = useState(false);
  const [selectedJobForLogs, setSelectedJobForLogs] = useState<Job | null>(null);
  const [testingResourceId, setTestingResourceId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; latencyMs: number; message: string } | null>(null);

  // Forms
  const [newResourceName, setNewResourceName] = useState('');
  const [newResourceType, setNewResourceType] = useState('database_postgres');
  const [newResourceCategory, setNewResourceCategory] = useState<'database' | 'server' | 'storage'>('database');
  const [newResourceHost, setNewResourceHost] = useState('127.0.0.1');
  const [newResourcePort, setNewResourcePort] = useState(5432);

  const [triggerOpType, setTriggerOpType] = useState('backup');
  const [triggerSourceId, setTriggerSourceId] = useState('');
  const [triggerDestId, setTriggerDestId] = useState('');

  const loadData = async () => {
    setLoading(true);
    const [res, j, pol, creds, aud] = await Promise.all([
      api.fetchResources(),
      api.fetchJobs(),
      api.fetchPolicies(),
      api.fetchCredentials(),
      api.fetchAuditLogs(),
    ]);
    setResources(res);
    setJobs(j);
    setPolicies(pol);
    setCredentials(creds);
    setAuditLogs(aud);
    if (res.length > 0) {
      setTriggerSourceId(res[0].id);
      setTriggerDestId(res.length > 1 ? res[1].id : res[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      const [j, res] = await Promise.all([api.fetchJobs(), api.fetchResources()]);
      setJobs(j);
      setResources(res);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTestConnection = async (id: string) => {
    setTestingResourceId(id);
    setTestResult(null);
    const res = await api.testResource(id);
    setTestResult({ id, ...res });
    setTestingResourceId(null);
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceName) return;
    await api.createResource({
      name: newResourceName,
      type: newResourceType,
      category: newResourceCategory,
      config: { host: newResourceHost, port: newResourcePort },
    });
    setNewResourceName('');
    setShowAddResource(false);
    await loadData();
  };

  const handleTriggerJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triggerSourceId) return;
    await api.createJob({
      operationType: triggerOpType,
      sourceResourceId: triggerSourceId,
      destinationResourceId: triggerDestId || undefined,
    });
    setShowTriggerJob(false);
    setActiveTab('jobs');
    const updated = await api.fetchJobs();
    setJobs(updated);
  };

  const handleTogglePolicy = async (id: string) => {
    await api.togglePolicy(id);
    const updated = await api.fetchPolicies();
    setPolicies(updated);
  };

  // Metrics
  const activeJobsCount = jobs.filter((j) => j.state === 'running' || j.state === 'planning').length;
  const healthyResourcesCount = resources.filter((r) => r.status === 'healthy').length;

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800/80 bg-[#0c1322]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                BackupOps
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
                CONTROL PLANE
              </span>
            </div>
            <p className="text-xs text-slate-400">Your infrastructure. Your data. Orchestrated.</p>
          </div>
        </div>

        {/* Global Stats & Status Pill */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cluster Healthy • BullMQ & Postgres Online</span>
          </div>

          <button
            onClick={() => setShowTriggerJob(true)}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition shadow-md shadow-blue-600/30 text-xs font-semibold text-white"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Operation</span>
          </button>

          <button
            onClick={() => setShowAddResource(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition text-xs font-medium text-slate-200"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Resource</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800/80 bg-[#0a0f1c] flex flex-col justify-between p-4">
          <div className="space-y-6">
            <div>
              <div className="px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Workspace
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 border border-slate-800 text-xs text-slate-200">
                <div className="flex items-center space-x-2 truncate">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="truncate font-semibold">Primary Production</span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">Default</span>
              </div>
            </div>

            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Overview</span>
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === 'resources'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Layers className="w-4 h-4" />
                  <span>Resources</span>
                </div>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">{resources.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('jobs')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === 'jobs'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <RotateCw className={`w-4 h-4 ${activeJobsCount > 0 ? 'animate-spin text-blue-300' : ''}`} />
                  <span>Operations & Jobs</span>
                </div>
                {activeJobsCount > 0 ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full animate-pulse">
                    {activeJobsCount} active
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">{jobs.length}</span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('policies')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === 'policies'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4" />
                  <span>Backup Policies</span>
                </div>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full">{policies.length}</span>
              </button>

              <button
                onClick={() => setActiveTab('vault')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === 'vault'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Credentials Vault</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  activeTab === 'audit'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Audit Logs</span>
              </button>
            </nav>
          </div>

          {/* Bottom Settings Link */}
          <div className="pt-4 border-t border-slate-800/60">
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Platform Settings</span>
            </button>
          </div>
        </aside>

        {/* Content View Area */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#090d16]">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">System Operations Overview</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Unified control plane monitoring data movement, policy automation, and infrastructure health.
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Connected Resources</span>
                    <Layers className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-white">{resources.length}</span>
                    <span className="text-xs text-emerald-400 font-medium">({healthyResourcesCount} online)</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">Servers, databases & storage</div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Active Operations</span>
                    <RotateCw className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-white">{activeJobsCount}</span>
                    <span className="text-xs text-amber-400 font-medium">in flight</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">BullMQ worker queue processing</div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Automated Policies</span>
                    <Clock className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-white">{policies.length}</span>
                    <span className="text-xs text-blue-400 font-medium">{policies.filter((p) => p.enabled).length} active</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">Scheduled retention & sync</div>
                </div>

                <div className="glass-panel p-5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                    <span>Vault Security</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-3 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-emerald-400">AES-256</span>
                    <span className="text-xs text-slate-400">GCM</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">Hardware & payload encryption at rest</div>
                </div>
              </div>

              {/* Active Jobs Section */}
              <div className="glass-panel rounded-xl border border-slate-800/80 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <h2 className="font-semibold text-sm text-white">Recent Data Operations</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1"
                  >
                    <span>View All Jobs</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {jobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="uppercase text-xs font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {job.operationType}
                          </span>
                          <span className="font-medium text-xs text-slate-200">Job {job.id}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              job.state === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : job.state === 'running'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                : 'bg-slate-700/50 text-slate-300'
                            }`}
                          >
                            {job.state.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{job.progress.currentStep}</p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="w-36">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Progress</span>
                            <span>{job.progress.percentage}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                              style={{ width: `${job.progress.percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedJobForLogs(job)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700"
                        >
                          Logs
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: RESOURCES */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white">Infrastructure Resources</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect and verify servers, databases, and backup destinations without routing data through proprietary clouds.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddResource(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Resource</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{testResult.message}</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold">{testResult.latencyMs}ms latency</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((res) => (
                  <div key={res.id} className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                          {res.category === 'database' && <Database className="w-4 h-4" />}
                          {res.category === 'storage' && <HardDrive className="w-4 h-4" />}
                          {res.category === 'server' && <Server className="w-4 h-4" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-white">{res.name}</h3>
                          <p className="text-[11px] text-slate-400">{res.description || res.type}</p>
                        </div>
                      </div>

                      <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>HEALTHY</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 font-mono text-[11px] text-slate-300">
                      {res.config.host && <div>Host: {res.config.host}:{res.config.port}</div>}
                      {res.config.bucket && <div>Bucket: {res.config.bucket} ({res.config.region})</div>}
                      {res.config.path && <div>Path: {res.config.path}</div>}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                      <span className="text-slate-500 text-[11px]">Type: {res.type}</span>
                      <button
                        onClick={() => handleTestConnection(res.id)}
                        disabled={testingResourceId === res.id}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
                      >
                        {testingResourceId === res.id ? 'Testing...' : 'Test Connection'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: OPERATIONS & JOBS */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white">Operations & Asynchronous Jobs</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time state machine tracking COPY, BACKUP, RESTORE, SYNC, and VERIFY tasks.
                  </p>
                </div>
                <button
                  onClick={() => setShowTriggerJob(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Operation</span>
                </button>
              </div>

              <div className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="px-5 py-3">Operation</th>
                      <th className="px-5 py-3">Job ID</th>
                      <th className="px-5 py-3">State</th>
                      <th className="px-5 py-3">Current Step / Progress</th>
                      <th className="px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-5 py-4 font-bold uppercase text-blue-400">
                          {job.operationType}
                        </td>
                        <td className="px-5 py-4 font-mono text-[11px]">{job.id}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              job.state === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : job.state === 'running'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                : 'bg-slate-700/50 text-slate-300'
                            }`}
                          >
                            {job.state.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-300">{job.progress.currentStep}</span>
                              <span className="font-semibold">{job.progress.percentage}%</span>
                            </div>
                            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all duration-300"
                                style={{ width: `${job.progress.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => setSelectedJobForLogs(job)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700"
                          >
                            Logs
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: POLICIES */}
          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white">Automated Backup Policies</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure recurring cron triggers, compression, encryption, and pruning retention rules.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-sm text-white">{policy.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{policy.description}</p>
                      </div>
                      <button
                        onClick={() => handleTogglePolicy(policy.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition ${
                          policy.enabled
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {policy.enabled ? 'ACTIVE' : 'PAUSED'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase">Schedule</span>
                        <div className="font-mono text-slate-200 mt-0.5">{policy.schedule.cronExpression}</div>
                      </div>
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800/60">
                        <span className="text-[10px] text-slate-500 uppercase">Encryption</span>
                        <div className="font-mono text-slate-200 mt-0.5 uppercase">{policy.options.encryption}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <span>Retention: {policy.retention.keepDaily || 7} daily • {policy.retention.keepMonthly || 12} monthly</span>
                      <span className="text-[11px] text-slate-500 font-mono">zstd compression</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-white">Encrypted Credentials Vault</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Credentials, private keys, and S3 tokens are encrypted at rest with AES-256-GCM. Plaintext is never emitted.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {credentials.map((cred) => (
                  <div key={cred.id} className="glass-panel p-5 rounded-xl border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <h3 className="font-semibold text-sm text-white">{cred.name}</h3>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        AES-256-GCM
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 font-mono text-[11px] text-slate-400">
                      Type: {cred.type} • Created: {new Date(cred.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold text-white">Compliance & Security Audit Logs</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Immutable record of all destructive actions, credential updates, and automated backup operations.
                </p>
              </div>

              <div className="glass-panel rounded-xl border border-slate-800/80 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Action</th>
                      <th className="px-5 py-3">Severity</th>
                      <th className="px-5 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-5 py-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-5 py-3 font-semibold text-white">{log.action}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                              log.severity === 'warning'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-400">{JSON.stringify(log.details)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h1 className="text-xl font-bold text-white">Control Plane Configuration</h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Self-hosted environment parameters and service topology status.
                </p>
              </div>

              <div className="glass-panel p-6 rounded-xl border border-slate-800/80 space-y-4 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Control Plane API Version</span>
                  <span className="font-mono text-white font-semibold">v1.0.0</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="font-mono text-white font-semibold">PostgreSQL 15</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Queue Engine</span>
                  <span className="font-mono text-white font-semibold">Redis 7 (BullMQ)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800">
                  <span className="text-slate-400">Host Infrastructure Agent</span>
                  <span className="font-mono text-white font-semibold">Go v1.21 Compatible</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Add Resource */}
      {showAddResource && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Connect Infrastructure Resource</h2>
              <button onClick={() => setShowAddResource(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Resource Name</label>
                <input
                  type="text"
                  placeholder="e.g. Analytics PostgreSQL DB"
                  value={newResourceName}
                  onChange={(e) => setNewResourceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Category</label>
                <select
                  value={newResourceCategory}
                  onChange={(e: any) => setNewResourceCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="database">Database</option>
                  <option value="storage">Storage Destination</option>
                  <option value="server">Linux / Host Server</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Resource Type</label>
                <select
                  value={newResourceType}
                  onChange={(e) => setNewResourceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="database_postgres">PostgreSQL 15/16</option>
                  <option value="database_mysql">MySQL / MariaDB</option>
                  <option value="storage_s3">S3 / MinIO Compatible</option>
                  <option value="storage_local">Local Filesystem Storage</option>
                  <option value="server_linux">Linux Host Server</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Host / Endpoint</label>
                  <input
                    type="text"
                    value={newResourceHost}
                    onChange={(e) => setNewResourceHost(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Port</label>
                  <input
                    type="number"
                    value={newResourcePort}
                    onChange={(e) => setNewResourcePort(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddResource(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30"
                >
                  Register Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Trigger Operation */}
      {showTriggerJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Execute On-Demand Operation</h2>
              <button onClick={() => setShowTriggerJob(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriggerJob} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Operation Type</label>
                <select
                  value={triggerOpType}
                  onChange={(e) => setTriggerOpType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white uppercase font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="backup">BACKUP (Snapshot & Retain)</option>
                  <option value="sync">SYNC (Delta Difference Transfer)</option>
                  <option value="copy">COPY (One-time transfer)</option>
                  <option value="verify">VERIFY (Checksum integrity check)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Source Resource</label>
                <select
                  value={triggerSourceId}
                  onChange={(e) => setTriggerSourceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Destination Resource</label>
                <select
                  value={triggerDestId}
                  onChange={(e) => setTriggerDestId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">None / Self-Verification</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTriggerJob(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/30"
                >
                  Queue Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Job Logs Drawer */}
      {selectedJobForLogs && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-2xl border border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Execution Logs: {selectedJobForLogs.id}</h2>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{selectedJobForLogs.operationType} Operation</span>
              </div>
              <button onClick={() => setSelectedJobForLogs(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-2 max-h-80 overflow-y-auto">
              {selectedJobForLogs.logs.map((log, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <span className="text-slate-500 text-[11px] whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className={`uppercase font-bold text-[10px] px-1 rounded ${log.level === 'warn' ? 'bg-amber-500/20 text-amber-400' : 'text-blue-400'}`}>
                    [{log.level}]
                  </span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedJobForLogs(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
