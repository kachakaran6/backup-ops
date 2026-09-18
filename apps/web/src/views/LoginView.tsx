import React, { useState, useEffect } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  User,
  Mail,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Server,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import * as api from '../services/api';

export const LoginView: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Registration fields
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Live API health check state
  const [apiHealth, setApiHealth] = useState<{
    checked: boolean;
    online: boolean;
    status: number;
    checking: boolean;
  }>({
    checked: false,
    online: false,
    status: 0,
    checking: true,
  });

  const from = (location.state as any)?.from?.pathname || '/overview';

  const checkConnectivity = async () => {
    setApiHealth((prev) => ({ ...prev, checking: true }));
    const result = await api.checkApiHealth();
    setApiHealth({
      checked: true,
      online: result.ok,
      status: result.status,
      checking: false,
    });
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  const handleFillDemo = () => {
    setMode('login');
    setIdentifier('admin@gmail.com');
    setPassword('admin@123');
    setErrorMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId || !password) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await login(cleanId, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
      checkConnectivity();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regUsername.trim() || !regPassword) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await register({
        email: regEmail.trim().toLowerCase(),
        username: regUsername.trim().toLowerCase(),
        displayName: regDisplayName.trim() || regUsername.trim(),
        password: regPassword,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed.');
      checkConnectivity();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Background subtle operational glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[420px] space-y-4 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-lg bg-surface border border-border shadow-sm mb-1">
            <Shield className="w-5 h-5 text-brand-primary" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-text-primary flex items-center justify-center gap-2">
            BackupOps Control Plane
          </h1>
          <p className="text-xs text-text-muted font-normal max-w-sm mx-auto">
            Self-Hosted Infrastructure Data Operations &amp; Recovery Orchestration
          </p>

          {/* Real-time API Connection Status Pill */}
          <div className="pt-1 flex items-center justify-center">
            <div
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
                apiHealth.checking
                  ? 'bg-surface-secondary text-text-muted border-border'
                  : apiHealth.online
                  ? 'bg-success/10 text-success border-success/30'
                  : 'bg-error/10 text-error border-error/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  apiHealth.checking
                    ? 'bg-text-muted animate-pulse'
                    : apiHealth.online
                    ? 'bg-success animate-pulse'
                    : 'bg-error'
                }`}
              />
              <span>
                {apiHealth.checking
                  ? 'Connecting to Control Plane...'
                  : apiHealth.online
                  ? 'Control Plane Online (200 OK)'
                  : `API Offline (${apiHealth.status || 'Unreachable'})`}
              </span>
              <button
                type="button"
                onClick={checkConnectivity}
                className="hover:opacity-80 transition-opacity ml-1"
                title="Refresh API Connection"
              >
                <RefreshCw
                  className={`w-3 h-3 ${apiHealth.checking ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="op-card-elevated p-6 space-y-5 shadow-xl border-border">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-surface-secondary rounded-lg border border-border">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'login'
                  ? 'bg-surface text-brand-primary shadow-xs border border-border'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Operator Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'register'
                  ? 'bg-surface text-brand-primary shadow-xs border border-border'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-md text-error text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5 font-sans">
                <p className="font-semibold">Authentication Notice</p>
                <p className="text-[11px] opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@gmail.com or admin"
                    className="op-input pl-9"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="op-input pl-9 pr-9 font-mono"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !identifier || !password}
                className="op-btn-primary w-full justify-center !py-2 font-medium"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
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
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="engineer@company.com"
                    className="op-input pl-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="karan"
                    className="op-input font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="Karan Hudia"
                    className="op-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="op-input pl-9 pr-9 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !regEmail || !regUsername || !regPassword}
                className="op-btn-primary w-full justify-center !py-2 font-medium"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Provisioning Operator Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Operator Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Fill Shortcut */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-text-muted">Bootstrap credentials:</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-mono text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Fill Admin (admin@gmail.com)</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-text-muted font-mono">
          BackupOps Control Plane v1.0.0-rc.3 • Self-Hosted Edition
        </div>
      </div>
    </div>
  );
};
