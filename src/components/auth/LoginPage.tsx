import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Building,
  Database,
  Sun,
  Moon,
  HelpCircle,
  Phone,
  Mail,
  Clock,
  X,
  KeyRound,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types/auth';

const ROLE_DESCRIPTIONS: Record<UserRole, { label: string; desc: string; badge: string }> = {
  ADMIN: {
    label: 'ADMINISTRATOR',
    desc: 'Akses Penuh: Infrastruktur, Pengguna, Audit Log & Pengaturan Sistem',
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40'
  },
  IT_ENGINEER: {
    label: 'IT ENGINEER',
    desc: 'Akses Operasional: Modifikasi Perangkat, Kabel FO, Rak & Tiket MTC',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40'
  },
  VIEWER: {
    label: 'OPERATOR VIEWER',
    desc: 'Akses Baca-Saja: Pemantauan Topologi, Denah Pabrik & Laporan Jaringan',
    badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800/40'
  }
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isMysqlConnected } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [selectedRolePreset, setSelectedRolePreset] = useState<UserRole>('ADMIN');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // States: Idle, Loading, Error, Success
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setErrorMsg('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setIsLoading(true);
    setErrorMsg('');
    setIsSuccess(false);

    const result = await signIn(identifier.trim(), password, rememberMe);

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 650);
    } else {
      setErrorMsg(result.error || 'Autentikasi gagal. Periksa kembali username dan kata sandi Anda.');
      if (result.remainingAttempts !== undefined) {
        setRemainingAttempts(result.remainingAttempts);
      }
      if (result.retryAfter) {
        setLockoutSeconds(result.retryAfter);
      }
      setIsLoading(false);
    }
  };

  // Tab hanya mengganti tampilan deskripsi role, TIDAK mengisi form
  const handleRolePreset = (presetRole: UserRole) => {
    setSelectedRolePreset(presetRole);
    setErrorMsg('');
    setRemainingAttempts(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-[#050811] flex items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-100 select-none relative overflow-hidden transition-colors">
      {/* Background Industrial Mesh Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-30 dark:opacity-25 pointer-events-none"></div>

      {/* Floating Theme Toggle (Top Right) */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 shadow-sm transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
          <span>{isDark ? 'Mode Terang' : 'Mode Gelap'}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-white/95 dark:bg-[#0B132B]/95 border border-slate-200 dark:border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-xl dark:shadow-2xl z-10 flex flex-col gap-5 animate-in fade-in transition-colors">
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-1 shadow-xl shadow-blue-500/20 mb-3 flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-[#0B132B] rounded-xl flex items-center justify-center p-1.5 overflow-hidden">
              <img src="/logo-192.png?v=3" alt="Network Map Logo" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            CBA Network Map
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            IT Infrastructure & Network Visualization System
          </p>
          <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-300 font-medium">
            <Building className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>PT. CBA Chemical Industry</span>
          </div>
        </div>

        {/* Quick Role Selector with Dynamic Permission Details */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Akun MySQL (Port 3306):</span>
            </span>
            <span className={`text-[10px] font-mono flex items-center gap-1 ${isMysqlConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isMysqlConnected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
              {isMysqlConnected ? 'MySQL XAMPP Online' : 'Local Fallback'}
            </span>
          </div>

          <div className="bg-slate-100 dark:bg-[#111A33] p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex gap-1 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => handleRolePreset('ADMIN')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                selectedRolePreset === 'ADMIN' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              ADMIN
            </button>
            <button
              type="button"
              onClick={() => handleRolePreset('IT_ENGINEER')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                selectedRolePreset === 'IT_ENGINEER' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              IT ENGINEER
            </button>
            <button
              type="button"
              onClick={() => handleRolePreset('VIEWER')}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                selectedRolePreset === 'VIEWER' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              VIEWER
            </button>
          </div>

          {/* Role Scope & Capability Notice */}
          <div className={`p-2 rounded-xl border text-[10px] flex items-start gap-1.5 ${ROLE_DESCRIPTIONS[selectedRolePreset].badge}`}>
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">
              <strong className="block">{ROLE_DESCRIPTIONS[selectedRolePreset].label}</strong>
              <span>{ROLE_DESCRIPTIONS[selectedRolePreset].desc}</span>
            </div>
          </div>

        </div>

        {/* Anti Brute-Force Lockout Alert */}
        {lockoutSeconds > 0 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
            <div className="leading-snug">
              <strong className="block font-semibold">Akun Dikunci Sementara</strong>
              <span>Silakan tunggu <strong>{lockoutSeconds} detik</strong> sebelum mencoba kembali.</span>
            </div>
          </div>
        )}

        {/* Error State Message */}
        {errorMsg && lockoutSeconds <= 0 && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <span className="block text-[10px] text-rose-500 mt-0.5">
                  Tersisa {remainingAttempts} kesempatan sebelum sistem mengunci akses.
                </span>
              )}
            </div>
          </div>
        )}

        {/* Success State Message */}
        {isSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Otentikasi berhasil! Mengarahkan ke Dashboard...</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
          {/* Username / Email Field */}
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1.5 font-medium">Username atau Email Perusahaan</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin / engineer / viewer / email"
                disabled={isLoading || isSuccess || lockoutSeconds > 0}
                className="w-full bg-slate-50 dark:bg-[#111A33] border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1.5 font-medium">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading || isSuccess || lockoutSeconds > 0}
                className="w-full bg-slate-50 dark:bg-[#111A33] border border-slate-300 dark:border-slate-700/80 rounded-xl pl-10 pr-10 py-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Help */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer text-[11px] font-semibold flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Bantuan IT</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isSuccess || lockoutSeconds > 0}
            className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Berhasil Masuk</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Indicator & Footer */}
        <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 flex flex-col gap-1">
          <div className="flex items-center justify-center gap-2 text-[9px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>scrypt + JWT HS256</span>
            </span>
            <span>•</span>
            <span>Anti Brute-Force Protected</span>
          </div>
          <div className="font-mono">
            PT. CBA Chemical Industry • IT Infrastructure & Network System
          </div>
        </div>
      </div>

      {/* IT Support Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 text-slate-800 dark:text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Helpdesk & Bantuan IT</h3>
                  <span className="text-[10px] text-slate-400 block">PT. CBA Chemical Industry</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Jika Anda lupa kata sandi atau akun terkunci akibat salah memasukkan kredensial berulang kali, hubungi tim IT Infrastructure CBA:
              </p>

              <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 rounded-2xl">
                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Ekstensi Telepon IT NOC:</span>
                    <strong className="font-mono text-xs">+62 254 401500 (Ext. 204)</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Email Dukungan IT:</span>
                    <strong className="font-mono text-xs">it.support@cba-chemical.co.id</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Jam Layanan Helpdesk:</span>
                    <span className="text-xs">Senin - Jumat: 08:00 - 17:00 WIB</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-[10px] text-blue-700 dark:text-blue-300">
                💡 Gunakan username dan kata sandi yang telah diberikan oleh administrator sistem. Jika lupa atau akun terkunci, hubungi tim IT NOC di nomor di atas.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
