import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  Network,
  ExternalLink
} from 'lucide-react';
import { BuildingNetworkStatusItem } from '../../services/dashboardRepository';

interface BuildingStatusTableProps {
  buildings: BuildingNetworkStatusItem[];
}

export const BuildingStatusTable: React.FC<BuildingStatusTableProps> = ({ buildings }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: BuildingNetworkStatusItem['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Healthy
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Warning
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            Critical
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-xs flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Building Network Status
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational status across all factory zones and production facilities
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/buildings')}
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
        >
          <span>Kelola Gedung</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Desktop Table View (Hidden on mobile) */}
      <div className="hidden md:block overflow-x-auto mt-2 -mx-5 px-5">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-3">Building</th>
              <th className="py-3 px-3 text-center">Devices</th>
              <th className="py-3 px-3 text-center">Online</th>
              <th className="py-3 px-3 text-center">Offline</th>
              <th className="py-3 px-3 text-center">Cable Routes</th>
              <th className="py-3 px-3 text-center">Main Switch</th>
              <th className="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium text-slate-700 dark:text-slate-300">
            {buildings.map((b) => (
              <tr 
                key={b.id} 
                onClick={() => navigate(`/buildings?code=${b.code}`)}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group"
              >
                {/* Building Name & Code */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {b.code}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {b.name}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        Zone: CBA-ID-{b.code}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Total Devices */}
                <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                  {b.devices}
                </td>

                {/* Online */}
                <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {b.online}
                </td>

                {/* Offline */}
                <td className="py-3 px-3 text-center font-mono font-bold">
                  {b.offline > 0 ? (
                    <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/50">
                      {b.offline}
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500">0</span>
                  )}
                </td>

                {/* Cable Routes */}
                <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                  <div className="inline-flex items-center gap-1">
                    <Network className="w-3 h-3 text-slate-400" />
                    <span>{b.cableRoutes} FO/UTP</span>
                  </div>
                </td>

                {/* Main Switch */}
                <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  {b.mainSwitch || '-'}
                </td>

                {/* Status Badge */}
                <td className="py-3 px-3 text-right">
                  {getStatusBadge(b.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Touch Card View (Visible only on screens < md) */}
      <div className="md:hidden space-y-3 mt-3">
        {buildings.map((b) => (
          <div
            key={b.id}
            onClick={() => navigate(`/buildings?code=${b.code}`)}
            className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2.5 cursor-pointer hover:border-blue-400 transition-all"
          >
            {/* Row 1: Code, Name & Status Badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {b.code}
                </span>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs truncate">
                    {b.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                    Zone: CBA-ID-{b.code}
                  </p>
                </div>
              </div>
              <div className="shrink-0">{getStatusBadge(b.status)}</div>
            </div>

            {/* Row 2: Grid of Device & Link Metrics */}
            <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 text-center font-mono">
              <div>
                <span className="text-[9px] uppercase text-slate-400 block font-sans font-semibold">Devs</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{b.devices}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-emerald-500 block font-sans font-semibold">Online</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{b.online}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-rose-500 block font-sans font-semibold">Offline</span>
                <span className={`text-xs font-bold ${b.offline > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>{b.offline}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase text-cyan-500 block font-sans font-semibold">Cables</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{b.cableRoutes}</span>
              </div>
            </div>

            {/* Row 3: Main Switch Info */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-0.5">
              <span>Main Switch: <strong className="text-slate-700 dark:text-slate-300">{b.mainSwitch || '-'}</strong></span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                Detail <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
