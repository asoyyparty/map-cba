import React from 'react';
import { 
  Construction, 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_CONFIGS } from '../../types/auth';

interface RoutePlaceholderProps {
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  requiredPermission?: string;
}

export const RoutePlaceholder: React.FC<RoutePlaceholderProps> = ({
  title,
  category,
  description,
  icon,
  requiredPermission
}) => {
  const location = useLocation();
  const { user, role, permissions } = useAuth();
  const roleConfig = ROLE_CONFIGS[role];

  return (
    <div className="w-full h-full p-6 md:p-8 overflow-y-auto flex flex-col gap-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 shadow-2xs">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {category}
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                {location.pathname}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Peran Aktif:</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${roleConfig.badgeClass}`}>
            {roleConfig.label}
          </span>
        </div>
      </div>

      {/* Main Professional Placeholder Card */}
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-8 flex flex-col items-center text-center max-w-3xl mx-auto w-full my-auto transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-cyan-400 flex items-center justify-center mb-4 shadow-xs">
          <Construction className="w-8 h-8 text-blue-600 dark:text-cyan-400 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Tahap 1 Berhasil: App Shell & Autentikasi Aktif</span>
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Modul {title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mt-2 leading-relaxed">
          Modul ini telah terdaftar dalam arsitektur routing enterprise dan App Shell CBA Network Map. Implementasi konten spesifik dijadwalkan pada tahap pengembangan berikutnya sesuai urutan roadmap aplikasi.
        </p>

        {/* Technical Specification Matrix */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 my-6 text-left font-mono text-xs">
          <div className="bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase">Route Endpoint</span>
            <strong className="text-blue-600 dark:text-cyan-400 text-xs mt-0.5 block">{location.pathname}</strong>
          </div>
          <div className="bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase">Kategori Menu</span>
            <strong className="text-slate-800 dark:text-slate-200 text-xs mt-0.5 block">{category}</strong>
          </div>
          <div className="bg-slate-50 dark:bg-[#111A33] border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
            <span className="text-slate-500 dark:text-slate-400 text-[10px] block uppercase">Izin Akses Role</span>
            <strong className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi ({role})
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard
          </Link>
          <Link
            to="/settings"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium text-xs rounded-xl transition-colors cursor-pointer"
          >
            Pengaturan Sistem
          </Link>
        </div>
      </div>
    </div>
  );
};
