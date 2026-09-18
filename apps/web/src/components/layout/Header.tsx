import React, { useState } from 'react';
import {
  RefreshCw,
  Plus,
  Cloud,
  Shield,
  Menu,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onToggleSidebar?: () => void;
  onQuickAction?: (action: 'coolify' | 'server' | 'backup') => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  onToggleSidebar,
  onQuickAction,
}) => {
  const { user, logout } = useAuth();
  const [showMobileActions, setShowMobileActions] = useState(false);

  return (
    <header className="h-14 border-b border-border bg-surface px-3 sm:px-6 flex items-center justify-between shrink-0 relative z-20">
      {/* Left side: Hamburger button on mobile + Titles */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary md:hidden cursor-pointer shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-semibold text-text-primary truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-text-muted truncate hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Actions, Refresh, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="op-btn-secondary !p-1.5 shrink-0"
            title="Refresh current state"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? 'animate-spin text-accent' : 'text-text-muted'
              }`}
            />
          </button>
        )}

        {/* Desktop Quick Actions */}
        {onQuickAction && (
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => onQuickAction('coolify')}
              className="op-btn-secondary"
            >
              <Cloud className="w-3.5 h-3.5 text-text-muted" />
              <span>Connect Coolify</span>
            </button>
            <button
              onClick={() => onQuickAction('server')}
              className="op-btn-secondary"
            >
              <Plus className="w-3.5 h-3.5 text-text-muted" />
              <span>Add Server</span>
            </button>
            <button
              onClick={() => onQuickAction('backup')}
              className="op-btn-primary"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Backup Now</span>
            </button>
          </div>
        )}

        {/* Mobile/Tablet Compact Quick Actions Menu */}
        {onQuickAction && (
          <div className="relative lg:hidden">
            <button
              onClick={() => setShowMobileActions(!showMobileActions)}
              className="op-btn-primary !py-1 !px-2 text-[11px]"
            >
              <Shield className="w-3 h-3" />
              <span className="hidden xs:inline">Actions</span>
              <ChevronDown className="w-3 h-3 ml-0.5" />
            </button>

            {showMobileActions && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowMobileActions(false)}
                />
                <div className="absolute right-0 mt-1 w-44 bg-surface-elevated border border-border rounded-lg shadow-xl py-1 z-40 text-xs font-medium">
                  <button
                    onClick={() => {
                      onQuickAction('backup');
                      setShowMobileActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-accent hover:bg-surface-secondary text-left cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Backup Now</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction('server');
                      setShowMobileActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-text-secondary hover:bg-surface-secondary text-left cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Server (SSH)</span>
                  </button>
                  <button
                    onClick={() => {
                      onQuickAction('coolify');
                      setShowMobileActions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-text-secondary hover:bg-surface-secondary text-left cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Connect Coolify</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* User profile & Logout */}
        {user && (
          <div className="flex items-center gap-1.5 pl-1.5 sm:pl-2 border-l border-border/80 ml-1">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[11px] font-medium text-text-primary max-w-[120px] truncate">
                {user.email}
              </span>
              <span className="text-[9px] font-mono text-accent uppercase">
                {user.role}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-surface-secondary transition-colors cursor-pointer"
              title="Sign out of BackupOps"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
