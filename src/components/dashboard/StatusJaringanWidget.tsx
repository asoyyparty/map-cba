import React from 'react';
import { NETWORK_STATUS_CATEGORIES } from '../../mock/cbaData';
import { Globe, Shield, GitFork, Server, Wifi, Monitor } from 'lucide-react';

export const StatusJaringanWidget: React.FC = () => {
  const getIcon = (title: string) => {
    switch (title) {
      case 'Internet': return <Globe className="w-4 h-4 text-blue-400" />;
      case 'Firewall': return <Shield className="w-4 h-4 text-purple-400" />;
      case 'Core Switch': return <GitFork className="w-4 h-4 text-cyan-400" />;
      case 'Distribution Switch': return <Server className="w-4 h-4 text-emerald-400" />;
      case 'Access Point': return <Wifi className="w-4 h-4 text-amber-400" />;
      default: return <Monitor className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-sm font-sans">
      <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
        Status Sub-Sistem Jaringan
      </h3>

      <div className="flex flex-col gap-1.5">
        {NETWORK_STATUS_CATEGORIES.map((cat, idx) => (
          <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 flex items-center justify-between text-xs font-sans">
            <div className="flex items-center gap-2.5">
              {getIcon(cat.title)}
              <span className="text-slate-800 font-medium">{cat.title}</span>
            </div>

            <div className="flex items-center gap-2.5 font-mono">
              <span className="flex items-center gap-1.5 font-bold text-xs">
                <span className={`w-2 h-2 rounded-full ${
                  cat.status === 'UP' && cat.onlineCount === cat.totalCount 
                    ? 'bg-emerald-500' 
                    : 'bg-amber-500'
                }`}></span>
                <span className={cat.status === 'UP' && cat.onlineCount === cat.totalCount ? 'text-emerald-700' : 'text-amber-700'}>
                  UP
                </span>
              </span>
              <span className="text-[11px] text-slate-500">
                {cat.onlineCount}/{cat.totalCount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
