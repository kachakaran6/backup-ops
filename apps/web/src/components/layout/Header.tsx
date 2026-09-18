import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  RefreshCw,
  Plus,
  Cloud,
  Shield,
  Menu,
  LogOut,
  User as UserIcon,
  Search,
  Sun,
  Moon,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { checkApiHealth } from '../../services/api';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  onQuickAction?: (action: 'coolify' | 'server' | 'backup') => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  onToggleSidebar,
  onOpenCommandPalette,
  onQuickAction,
}) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [apiHealth, setApiHealth] = useState<'healthy' | 'unreachable' | 'checking'>('checking');

  // Check backend health periodically
  useEffect(() => {
    let isMounted = true;
    const probe = async () => {
      try {
        const res = await checkApiHealth();
        if (isMounted) {
          setApiHealth(res.ok ? 'healthy' : 'unreachable');
        }
      } catch {
        if (isMounted) setApiHealth('unreachable');
      }
    };

    probe();
    const interval = setInterval(probe, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Build breadcrumbs based on pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, idx) => {
    const url = '/' + pathParts.slice(0, idx + 1).join('/');
    const label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
    return { url, label };
  });

  return (
    <header className="h-14 border-b border-border bg-surface px-3 sm:px-5 flex items-center justify-between shrink-0 relative z-20 select-none">
      {/* Left: Mobile hamburger + Breadcrumbs / Title */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-secondary md:hidden cursor-pointer shrink-0"
            aria-label="Toggle navigation"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Breadcrumb path */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs">
            <Link
              to="/overview"
              className="text-text-muted hover:text-text-primary transition-colors font-mono hidden sm:inline"
            >
              Control Plane
            </Link>
            {breadcrumbs.length > 0 && (
              <ChevronRight className="w-3 h-3 text-text-muted shrink-0 hidden sm:inline" />
            )}
            <h1 className="text-xs sm:text-sm font-semibold text-text-primary truncate">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-[11px] text-text-muted truncate hidden xl:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls: Command search, Health, Actions, Theme, User */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Global Search trigger (Cmd+K) */}
        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-secondary border border-border text-xs text-text-muted hover:text-text-primary hover:border-border-strong transition-colors cursor-pointer"
            title="Search resources and commands (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-sans">Search...</span>
            <kbd className="hidden md:inline-block font-mono text-[10px] px-1 py-0.2 rounded bg-surface border border-border text-text-muted">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Live System Health Badge */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${
            apiHealth === 'healthy'
              ? 'bg-success/10 text-success border-success/30'
              : apiHealth === 'unreachable'
              ? 'bg-error/10 text-error border-error/30'
              : 'bg-surface-secondary text-text-muted border-border'
          }`}
          title={
            apiHealth === 'healthy'
              ? 'Control Plane API operational'
              : 'Control Plane API offline or unreachable'
          }
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              apiHealth === 'healthy'
                ? 'bg-success animate-pulse'
                : apiHealth === 'unreachable'
                ? 'bg-error'
                : 'bg-text-muted'
            }`}
          />
          <span>{apiHealth === 'healthy' ? 'API LIVE' : apiHealth === 'unreachable' ? 'API OFFLINE' : 'CHECKING'}</span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="op-btn-secondary !p-1.5 shrink-0"
            title="Refresh active state"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? 'animate-spin text-brand' : 'text-text-muted'
              }`}
            />
          </button>
        )}

        {/* Quick Action Button */}
        {onQuickAction && (
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              onClick={() => onQuickAction('coolify')}
              className="op-btn-secondary !py-1 !px-2.5 !text-xs"
            >
              <Cloud className="w-3 h-3 text-text-muted" />
              <span>Coolify</span>
            </button>
            <button
              onClick={() => onQuickAction('server')}
              className="op-btn-secondary !py-1 !px-2.5 !text-xs"
            >
              <Plus className="w-3 h-3 text-text-muted" />
              <span>Server</span>
            </button>
            <button
              onClick={() => onQuickAction('backup')}
              className="op-btn-primary !py-1 !px-2.5 !text-xs"
            >
              <Shield className="w-3 h-3" />
              <span>Backup</span>
            </button>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="op-btn-secondary !p-1.5 shrink-0"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-text-muted hover:text-brand" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-text-muted hover:text-brand" />
          )}
        </button>

        {/* User Account Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pl-1.5 rounded-lg border border-border bg-surface-secondary hover:border-border-strong transition-colors cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-brand text-[10px] font-bold font-mono">
              {(user?.displayName || user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-text-primary hidden md:inline max-w-[100px] truncate">
              {user?.displayName || user?.username || 'Admin'}
            </span>
          </button>

          {/* User Menu Modal */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-lg shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-text-primary truncate">
                    {user?.displayName || user?.username || 'Administrator'}
                  </p>
                  <p className="text-[11px] text-text-muted truncate font-mono">
                    {user?.email || 'admin@gmail.com'}
                  </p>
                  <span className="inline-block mt-1 text-[9px] font-mono font-medium px-1.5 py-0.2 rounded bg-brand/10 text-brand border border-brand/20 uppercase">
                    {user?.role || 'SUPER_ADMIN'}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center gap-2"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Workspace Settings</span>
                  </Link>
                  <a
                    href="/api/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>OpenAPI Swagger</span>
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">/docs</span>
                  </a>
                </div>

                <div className="border-t border-border pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-error hover:bg-error/10 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
