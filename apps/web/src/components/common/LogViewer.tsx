import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Terminal, Copy, Download, Search, Check, ArrowDown } from 'lucide-react';

export interface LogEntry {
  timestamp?: string;
  level?: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | string;
  message: string;
}

interface LogViewerProps {
  logs: LogEntry[] | string[];
  title?: string;
  isStreaming?: boolean;
  maxHeight?: string;
  className?: string;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  title = 'Execution Log Stream',
  isStreaming = false,
  maxHeight = '420px',
  className = '',
}) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Normalize string[] or LogEntry[] and mask credentials
  const normalizedLogs: LogEntry[] = useMemo(() => {
    return logs.map((l) => {
      let rawMsg = typeof l === 'string' ? l : l.message;
      let rawTime = typeof l === 'string' ? '' : l.timestamp;
      let rawLevel = typeof l === 'string' ? 'INFO' : l.level || 'INFO';

      // Parse inline timestamps & levels if present in string e.g. "[2026-09-18T18:05:27Z] [ERROR] ..."
      const levelMatch = rawMsg.match(/\[(INFO|WARN|WARNING|ERROR|FATAL|DEBUG)\]/i);
      if (levelMatch) {
        rawLevel = levelMatch[1].toUpperCase();
      }

      // Mask sensitive credentials
      const masked = rawMsg
        .replace(/(password|token|secret|key)=([^\s&]+)/gi, '$1=***')
        .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, 'Bearer ***')
        .replace(/-----BEGIN[ A-Z0-9_-]+-----[\s\S]*?-----END[ A-Z0-9_-]+-----/g, '[PROTECTED PRIVATE KEY]');

      return {
        timestamp: rawTime,
        level: rawLevel,
        message: masked,
      };
    });
  }, [logs]);

  // Filter logs by level and search
  const filtered = useMemo(() => {
    return normalizedLogs.filter((entry) => {
      if (filterLevel !== 'ALL') {
        const lvl = (entry.level || '').toUpperCase();
        if (filterLevel === 'WARN' && !lvl.includes('WARN')) return false;
        if (filterLevel === 'ERROR' && !lvl.includes('ERROR') && !lvl.includes('FATAL')) return false;
        if (filterLevel === 'INFO' && !lvl.includes('INFO')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          entry.message.toLowerCase().includes(q) ||
          (entry.timestamp && entry.timestamp.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [normalizedLogs, filterLevel, searchQuery]);

  // Handle auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered, autoScroll]);

  // Detect manual scroll up to disable auto-scroll
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    setAutoScroll(isAtBottom);
  };

  const copyToClipboard = () => {
    const text = filtered.map((l) => `${l.timestamp ? `[${l.timestamp}] ` : ''}[${l.level}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadLogs = () => {
    const text = filtered.map((l) => `${l.timestamp ? `[${l.timestamp}] ` : ''}[${l.level}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backupops-log-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`rounded-lg border border-border overflow-hidden bg-[#0F1117] text-slate-200 font-mono text-xs ${className}`}>
      {/* Log Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#161822] border-b border-border text-[11px]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-brand" />
          <span className="font-semibold text-slate-200">{title}</span>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 text-[10px] text-success font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              LIVE
            </span>
          )}
          <span className="text-slate-500">({filtered.length} lines)</span>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter text..."
              className="bg-[#0F1117] border border-border text-slate-200 text-[11px] rounded pl-6 pr-2 py-0.5 outline-none focus:border-brand w-28 sm:w-36"
            />
          </div>

          {/* Level Filter Buttons */}
          <div className="flex items-center border border-border rounded overflow-hidden">
            {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  filterLevel === lvl
                    ? 'bg-brand/20 text-brand'
                    : 'bg-[#0F1117] text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => {
              setAutoScroll(true);
              if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }}
            className={`p-1 rounded border transition-colors ${
              autoScroll
                ? 'bg-brand/10 border-brand/30 text-brand'
                : 'border-border text-slate-500 hover:text-slate-200'
            }`}
            title="Auto-scroll to bottom"
          >
            <ArrowDown className="w-3 h-3" />
          </button>

          {/* Copy Button */}
          <button
            onClick={copyToClipboard}
            className="p-1 rounded border border-border text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
            title="Copy logs"
          >
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
          </button>

          {/* Download Button */}
          <button
            onClick={downloadLogs}
            className="p-1 rounded border border-border text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
            title="Download log file"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ maxHeight }}
        className="overflow-y-auto p-3 space-y-1 select-text leading-relaxed"
      >
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No log records matching criteria
          </div>
        ) : (
          filtered.map((entry, idx) => {
            const lvl = (entry.level || 'INFO').toUpperCase();
            let lvlColor = 'text-slate-400';
            if (lvl.includes('ERROR') || lvl.includes('FATAL')) lvlColor = 'text-red-400';
            else if (lvl.includes('WARN')) lvlColor = 'text-amber-400';
            else if (lvl.includes('INFO')) lvlColor = 'text-blue-400';

            return (
              <div key={idx} className="flex items-start gap-2 hover:bg-slate-900/40 px-1 py-0.5 rounded">
                <span className="text-slate-600 select-none text-[10px] w-6 shrink-0 text-right">
                  {idx + 1}
                </span>
                {entry.timestamp && (
                  <span className="text-slate-500 text-[10px] shrink-0">
                    {entry.timestamp}
                  </span>
                )}
                <span className={`text-[10px] font-bold shrink-0 ${lvlColor}`}>
                  [{lvl}]
                </span>
                <span className="text-slate-300 break-all whitespace-pre-wrap flex-1">
                  {entry.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
