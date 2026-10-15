import React from 'react';

export const CompassRose: React.FC = () => {
  return (
    <div className="absolute bottom-36 left-4 z-20 pointer-events-none select-none" title="Arah Mata Angin Pabrik (Utara)">
      <div className="relative w-12 h-12 rounded-full bg-white/95 dark:bg-[#0B132B]/95 backdrop-blur border border-slate-200 dark:border-slate-700/80 shadow-md dark:shadow-xl flex items-center justify-center">
        {/* Compass Crosshair lines */}
        <div className="absolute w-full h-[1px] bg-slate-300 dark:bg-slate-700/60"></div>
        <div className="absolute h-full w-[1px] bg-slate-300 dark:bg-slate-700/60"></div>

        {/* Outer Ring */}
        <div className="absolute w-10 h-10 rounded-full border border-blue-400/40 dark:border-blue-500/40"></div>

        {/* Needle */}
        <div className="absolute w-1 h-7 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-full transform -rotate-12 shadow-md"></div>

        {/* Cardinal Points */}
        <span className="absolute -top-1.5 text-[8px] font-mono font-black text-slate-700 dark:text-slate-300">N</span>
        <span className="absolute -right-1 text-[8px] font-mono font-black text-slate-500 dark:text-slate-400">E</span>
        <span className="absolute -bottom-1.5 text-[8px] font-mono font-black text-slate-500 dark:text-slate-400">S</span>
        <span className="absolute -left-1 text-[8px] font-mono font-black text-slate-500 dark:text-slate-400">W</span>
      </div>
    </div>
  );
};
