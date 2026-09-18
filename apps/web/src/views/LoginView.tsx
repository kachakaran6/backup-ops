import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/overview';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err.message && err.message.includes('Failed to fetch')) {
        setErrorMessage('Server unavailable. Ensure BackupOps API is reachable.');
      } else {
        setErrorMessage(err.message || 'Invalid email or password.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-center items-center px-4 py-12 select-none">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-surface-secondary border border-border mb-1">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-text-primary">
            BackupOps Control Plane
          </h1>
          <p className="text-xs text-text-muted font-mono">
            Infrastructure Data Operations & Recovery Orchestration
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-lg bg-surface border border-border space-y-5">
          <div className="border-b border-border pb-3">
            <h2 className="text-xs font-mono font-medium text-text-secondary uppercase tracking-wider">
              Operator Authentication
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Enter authorized administrator credentials to manage infrastructure
            </p>
          </div>

          {errorMessage && (
            <div className="op-alert-error text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="op-input pl-9 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-text-secondary">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="op-input pl-9 pr-9 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="op-btn-primary w-full py-2 px-4 text-xs font-semibold cursor-pointer mt-2"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-background border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Notice */}
        <div className="text-center text-[11px] text-text-muted space-y-1 font-mono">
          <p>Encrypted control plane access • AES-256 session integrity</p>
          <p>Initial admin bootstrap: admin@gmail.com / admin@123</p>
        </div>
      </div>
    </div>
  );
};
