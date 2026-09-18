import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-lg bg-surface-secondary border border-border flex items-center justify-center">
          <Shield className="w-5 h-5 text-accent animate-pulse" />
        </div>
        <p className="text-xs text-text-muted font-mono">Verifying control plane session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

