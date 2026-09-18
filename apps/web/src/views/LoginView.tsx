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
    <div className="min-h-screen bg-[#080B10] text-[#E7EAEE] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden">
      {/* Background ambient decorative glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[440px] space-y-5 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#11161F] border border-[#252C34] shadow-lg shadow-black/40 mb-1">
            <Shield className="w-6 h-6 text-[#7EA6D8]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            BackupOps Control Plane
          </h1>
          <p className="text-xs text-[#8A95A5] font-normal max-w-sm mx-auto">
            Self-Hosted Infrastructure Data Operations & Recovery Orchestration
          </p>

          {/* Real-time API Connection Status Pill */}
          <div className="pt-1 flex items-center justify-center">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors ${
                apiHealth.checking
                  ? 'bg-[#151A20] text-[#A5ADB8] border-[#252C34]'
                  : apiHealth.online
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                  : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  apiHealth.checking
                    ? 'bg-slate-400 animate-pulse'
                    : apiHealth.online
                    ? 'bg-emerald-400'
                    : 'bg-amber-400 animate-ping'
                }`}
              />
              <span>
                {apiHealth.checking
                  ? 'Checking API...'
                  : apiHealth.online
                  ? 'Control Plane Online'
                  : `API Unreachable (${apiHealth.status || '502/Down'})`}
              </span>
              <button
                type="button"
                onClick={checkConnectivity}
                title="Recheck API connectivity"
                className="ml-1 hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${apiHealth.checking ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Auth Main Card */}
        <div className="rounded-xl bg-[#11151A]/95 border border-[#252C34] shadow-2xl shadow-black/60 backdrop-blur-md overflow-hidden">
          {/* Tabs: Sign In vs Register */}
          <div className="flex border-b border-[#252C34] bg-[#0D1117]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'border-[#7EA6D8] text-white bg-[#11151A]'
                  : 'border-transparent text-[#8A95A5] hover:text-[#E7EAEE]'
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
              className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'border-[#7EA6D8] text-white bg-[#11151A]'
                  : 'border-transparent text-[#8A95A5] hover:text-[#E7EAEE]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Account</span>
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Error Message Callout */}
            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-200 text-xs flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Offline Helper Alert */}
            {!apiHealth.online && !apiHealth.checking && (
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200/90 text-xs flex items-start gap-2.5">
                <Server className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  The API service returned HTTP {apiHealth.status || '502'}. The backend container may still be starting or applying schema updates.
                </div>
              </div>
            )}

            {mode === 'login' ? (
              /* --- LOGIN FORM --- */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#A5ADB8] mb-1.5">
                    Email or Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#727C88]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      autoFocus
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="admin@gmail.com or admin"
                      style={{ paddingLeft: '2.75rem' }}
                      className="w-full bg-[#151A20] border border-[#252C34] rounded-lg py-2.5 pr-4 text-sm text-[#E7EAEE] placeholder-[#727C88] focus:outline-none focus:border-[#7EA6D8] focus:ring-1 focus:ring-[#7EA6D8]/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-[#A5ADB8]">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#727C88]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                      className="w-full bg-[#151A20] border border-[#252C34] rounded-lg py-2.5 text-sm text-[#E7EAEE] placeholder-[#727C88] focus:outline-none focus:border-[#7EA6D8] focus:ring-1 focus:ring-[#7EA6D8]/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#727C88] hover:text-[#E7EAEE] transition-colors cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !identifier.trim() || !password}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#7EA6D8] hover:bg-[#91B7E6] active:scale-[0.99] text-[#0B0D10] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0B0D10] border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Authenticate Session</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Quick Autofill Demo Credentials */}
                <div className="pt-2 border-t border-[#1F262F]">
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="w-full py-2 px-3 rounded-lg bg-[#151A20] hover:bg-[#1C222B] border border-[#252C34] text-xs text-[#A5ADB8] hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#7EA6D8] group-hover:rotate-12 transition-transform" />
                    <span>Auto-fill default credentials: <code className="text-[#7EA6D8] font-mono">admin@gmail.com</code> / <code className="text-[#7EA6D8] font-mono">admin@123</code></span>
                  </button>
                </div>
              </form>
            ) : (
              /* --- REGISTER FORM --- */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#A5ADB8] mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#727C88]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="operator@company.com"
                      style={{ paddingLeft: '2.75rem' }}
                      className="w-full bg-[#151A20] border border-[#252C34] rounded-lg py-2 pr-4 text-sm text-[#E7EAEE] placeholder-[#727C88] focus:outline-none focus:border-[#7EA6D8] focus:ring-1 focus:ring-[#7EA6D8]/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A5ADB8] mb-1">
                    Operator Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#727C88]">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="devops_lead"
                      style={{ paddingLeft: '2.75rem' }}
                      className="w-full bg-[#151A20] border border-[#252C34] rounded-lg py-2 pr-4 text-sm text-[#E7EAEE] placeholder-[#727C88] focus:outline-none focus:border-[#7EA6D8] focus:ring-1 focus:ring-[#7EA6D8]/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A5ADB8] mb-1">
                    Full Name / Display Name
                  </label>
                  <input
                    type="text"
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-[#151A20] border border-[#252C34] rounded-lg py-2 px-3.5 text-sm text-[#E7EAEE] placeholder-[#727C88] focus:outline-none focus:border-[#7EA6D8] focus:ring-1 focus:ring-[#7EA6D8]/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#A5ADB8] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#727C88]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                      className="w-full bg-[#151A20] border border-[#252C34] rounded-lg py-2 text-sm text-[#E7EAEE] placeholder-[#727C88] focus:outline-none focus:border-[#7EA6D8] focus:ring-1 focus:ring-[#7EA6D8]/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#727C88] hover:text-[#E7EAEE] transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !regEmail || !regUsername || !regPassword}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#7EA6D8] hover:bg-[#91B7E6] active:scale-[0.99] text-[#0B0D10] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-3"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0B0D10] border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Operator Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Security & Verification Badges */}
        <div className="text-center text-[11px] text-[#727C88] space-y-1.5">
          <div className="flex items-center justify-center gap-3">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              AES-256 Vault Encryption
            </span>
            <span>•</span>
            <span>Role-Based Access (RBAC)</span>
            <span>•</span>
            <span>Audit Trail Logged</span>
          </div>
          <p className="font-mono text-[10px] text-[#55606E]">
            BackupOps Orchestrator v1.0.0 • Air-Gapped / Self-Hosted
          </p>
        </div>
      </div>
    </div>
  );
};
