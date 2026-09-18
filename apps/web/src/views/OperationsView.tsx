import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  FileText,
  X,
  Database,
  ArrowRight,
} from 'lucide-react';
import { Job } from '../types';
import * as api from '../services/api';
import { EmptyState } from '../components/common/EmptyState';

export const OperationsView: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterState, setFilterState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const loadJobs = async () => {
    setLoading(true);
    const data = await api.fetchJobs();
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(async () => {
      const data = await api.fetchJobs();
      setJobs(data);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const filteredJobs = jobs.filter((j) => {
    if (filterState === 'active' && !(j.state === 'running' || j.state === 'planning' || j.state === 'verifying')) return false;
    if (filterState === 'completed' && j.state !== 'completed') return false;
    if (filterState === 'failed' && j.state !== 'failed') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        j.id.toLowerCase().includes(q) ||
        j.operationType.toLowerCase().includes(q) ||
        (j.progress?.currentStep && j.progress.currentStep.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            COMPLETED
          </span>
        );
      case 'running':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
            RUNNING
          </span>
        );
      case 'verifying':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <Activity className="w-3.5 h-3.5" />
            VERIFYING
          </span>
        );
      case 'planning':
      case 'queued':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
            <Clock className="w-3.5 h-3.5" />
            {state.toUpperCase()}
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-800 text-zinc-400">
            {state.toUpperCase()}
          </span>
        );
    }
  };

  const activeCount = jobs.filter((j) => j.state === 'running' || j.state === 'planning' || j.state === 'verifying').length;
  const completedCount = jobs.filter((j) => j.state === 'completed').length;
  const failedCount = jobs.filter((j) => j.state === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Operations & Asynchronous Jobs
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real BullMQ worker queue orchestration tracking streaming backups, checksums, and restores.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Total Operations</div>
          <div className="mt-2 text-2xl font-bold text-zinc-100 font-mono">{jobs.length}</div>
          <div className="text-[10px] text-zinc-400 mt-1">All recorded operations</div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Active In-Flight</div>
          <div className="mt-2 text-2xl font-bold text-amber-400 font-mono">{activeCount}</div>
          <div className="text-[10px] text-zinc-400 mt-1">Worker currently executing</div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Completed</div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">{completedCount}</div>
          <div className="text-[10px] text-zinc-400 mt-1">Successful operations</div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Failed</div>
          <div className="mt-2 text-2xl font-bold text-rose-400 font-mono">{failedCount}</div>
          <div className="text-[10px] text-zinc-400 mt-1">Requires inspection</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by job ID or step..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterState('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterState === 'all'
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All ({jobs.length})
          </button>
          <button
            onClick={() => setFilterState('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterState === 'active'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterState('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterState === 'completed'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setFilterState('failed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterState === 'failed'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Failed ({failedCount})
          </button>
        </div>
      </div>

      {/* Jobs Table */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Operations Found"
          description={
            jobs.length === 0
              ? 'No operations have been queued or executed yet. Backups or restores triggered from database views will appear here.'
              : 'No operations match the selected filter.'
          }
        />
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
              <tr>
                <th className="px-5 py-3">Operation</th>
                <th className="px-5 py-3">Job ID</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Progress / Current Step</th>
                <th className="px-5 py-3">Timing</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="px-5 py-4">
                    <span className="uppercase text-xs font-bold font-mono tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {job.operationType}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-[11px] text-zinc-300">{job.id}</td>
                  <td className="px-5 py-4">{getStatusBadge(job.state)}</td>
                  <td className="px-5 py-4">
                    <div className="space-y-1.5 w-60">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-zinc-400 truncate max-w-[180px]">{job.progress?.currentStep || 'Initializing...'}</span>
                        <span className="font-semibold font-mono text-zinc-200">{job.progress?.percentage || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            job.state === 'completed'
                              ? 'bg-emerald-500'
                              : job.state === 'failed'
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${job.progress?.percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-zinc-400 text-[11px]">
                    <div>{new Date(job.createdAt).toLocaleTimeString()}</div>
                    {job.progress?.durationSeconds && (
                      <div className="text-[10px] text-zinc-400 font-mono">{job.progress.durationSeconds}s elapsed</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-medium transition"
                    >
                      View Logs
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-sm text-zinc-100">
                  Operation Logs — <span className="font-mono text-xs">{selectedJob.id}</span>
                </h3>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-zinc-400 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-900/60 rounded-lg border border-zinc-800/80 font-mono text-[11px]">
                <div>
                  <span className="text-zinc-400">Operation:</span>{' '}
                  <span className="text-blue-400 font-bold uppercase">{selectedJob.operationType}</span>
                </div>
                <div>
                  <span className="text-zinc-400">State:</span>{' '}
                  <span className="text-zinc-200 uppercase">{selectedJob.state}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Step:</span>{' '}
                  <span className="text-zinc-300">{selectedJob.progress?.currentStep || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Bytes:</span>{' '}
                  <span className="text-zinc-300">{selectedJob.progress?.bytesProcessed ? `${(selectedJob.progress.bytesProcessed / (1024 * 1024)).toFixed(2)} MB` : 'N/A'}</span>
                </div>
              </div>

              <div className="p-3 bg-black rounded-lg border border-zinc-800 font-mono text-[11px] max-h-64 overflow-y-auto space-y-1">
                {selectedJob.logs && selectedJob.logs.length > 0 ? (
                  selectedJob.logs.map((log: any, idx: number) => (
                    <div key={idx} className="text-zinc-300 flex items-start gap-2">
                      <span className="text-zinc-400 shrink-0">[{new Date(log.timestamp || Date.now()).toLocaleTimeString()}]</span>
                      <span className={log.level === 'error' ? 'text-rose-400' : 'text-zinc-300'}>
                        {typeof log === 'string' ? log : log.message}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-zinc-400 italic">No detailed log entries recorded for this job.</div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
