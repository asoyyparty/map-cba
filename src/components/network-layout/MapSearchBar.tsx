import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  X, 
  Building2, 
  Server, 
  Network, 
  Globe,
  ArrowRight
} from 'lucide-react';
import { Building, Device, CableRoute } from '../../types';

export interface SearchResultItem {
  id: string;
  type: 'building' | 'device' | 'cable';
  title: string;
  subtitle: string;
  badge: string;
  status: string;
  targetObject: Building | Device | CableRoute;
}

interface MapSearchBarProps {
  buildings: Building[];
  devices: Device[];
  cableRoutes: CableRoute[];
  onSelectResult: (result: SearchResultItem) => void;
}

export const MapSearchBar: React.FC<MapSearchBarProps> = ({
  buildings,
  devices,
  cableRoutes,
  onSelectResult
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter items matching query
  const cleanQ = query.trim().toLowerCase();

  const results: SearchResultItem[] = [];

  if (cleanQ.length > 0) {
    // 1. Search Buildings: by Code or Name
    buildings.forEach(bld => {
      if (bld.code.toLowerCase().includes(cleanQ) || bld.name.toLowerCase().includes(cleanQ)) {
        results.push({
          id: bld.id,
          type: 'building',
          title: `${bld.code} - ${bld.name}`,
          subtitle: `Gedung: ${bld.lokasi || bld.category} • ${bld.totalDevices} Devices`,
          badge: bld.code,
          status: bld.status,
          targetObject: bld
        });
      }
    });

    // 2. Search Devices: by Code, Name, or IP Address
    devices.forEach(dev => {
      if (
        dev.name.toLowerCase().includes(cleanQ) ||
        dev.ip.toLowerCase().includes(cleanQ) ||
        (dev.model && dev.model.toLowerCase().includes(cleanQ)) ||
        (dev.type && dev.type.toLowerCase().includes(cleanQ))
      ) {
        results.push({
          id: dev.id,
          type: 'device',
          title: dev.name,
          subtitle: `IP: ${dev.ip} • ${dev.buildingName || 'Gedung'} • ${dev.model}`,
          badge: dev.type,
          status: dev.status,
          targetObject: dev
        });
      }
    });

    // 3. Search Cable Routes: by Code or Name
    cableRoutes.forEach(cable => {
      if (
        cable.code.toLowerCase().includes(cleanQ) ||
        cable.name.toLowerCase().includes(cleanQ) ||
        cable.type.toLowerCase().includes(cleanQ)
      ) {
        results.push({
          id: cable.id,
          type: 'cable',
          title: cable.code,
          subtitle: `${cable.name} (${cable.type.toUpperCase()}) • ${cable.totalCores} Core • ${cable.lengthMeters}m`,
          badge: cable.type,
          status: cable.status,
          targetObject: cable
        });
      }
    });
  }

  const handleSelect = (item: SearchResultItem) => {
    onSelectResult(item);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-64 md:w-72 min-w-0 font-sans text-xs select-none">
      {/* Search Input Field */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari gedung, device, kabel..."
          className="w-full bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-9 pr-8 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono text-xs shadow-md dark:shadow-lg transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && cleanQ.length > 0 && (
        <div className="absolute top-full left-0 right-0 min-w-[280px] max-w-[calc(100vw-2rem)] mt-2 bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden z-50 animate-in fade-in max-h-80 flex flex-col">
          {/* Header Count */}
          <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
            <span>Hasil Pencarian ({results.length}):</span>
            <span className="text-cyan-600 dark:text-cyan-400">Pilih untuk memusatkan kamera</span>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
            {results.length > 0 ? (
              results.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full p-2.5 text-left rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#111A33] border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 group-hover:border-cyan-500 transition-colors">
                      {item.type === 'building' ? (
                        <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : item.type === 'device' ? (
                        <Server className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Network className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 uppercase">
                      {item.badge}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" />
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                Tidak ada entitas yang sesuai dengan "{query}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
