import React, { useState } from 'react';
import { CableRoute, Point, CableType, CableStatus, Building } from '../../types';
import { X, Network, CheckCircle2, GitFork, ArrowRight } from 'lucide-react';

interface AddCableOnMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cable: CableRoute) => void;
  pathPoints: Point[];
  startBuilding?: Building | null;
  endBuilding?: Building | null;
  existingCablesCount: number;
}

export const AddCableOnMapModal: React.FC<AddCableOnMapModalProps> = ({
  isOpen,
  onClose,
  onSave,
  pathPoints,
  startBuilding,
  endBuilding,
  existingCablesCount
}) => {
  const nextNum = String(existingCablesCount + 1).padStart(3, '0');
  const [code, setCode] = useState(`FO-${nextNum}`);
  const [name, setName] = useState(
    startBuilding && endBuilding
      ? `Jalur FO: ${startBuilding.name} → ${endBuilding.name}`
      : `Rute Kabel Baru ${nextNum}`
  );
  const [type, setType] = useState<CableType>('fiber');
  const [status, setStatus] = useState<CableStatus>('active');
  const [totalCores, setTotalCores] = useState<number>(12);
  const [bandwidth, setBandwidth] = useState<string>('10 Gbps');

  if (!isOpen) return null;

  // Approximate length in meters based on Euclidean pixel distances
  let approxMeters = 50;
  if (pathPoints.length >= 2) {
    let pxDist = 0;
    for (let i = 1; i < pathPoints.length; i++) {
      const dx = pathPoints[i].x - pathPoints[i - 1].x;
      const dy = pathPoints[i].y - pathPoints[i - 1].y;
      pxDist += Math.sqrt(dx * dx + dy * dy);
    }
    approxMeters = Math.round(pxDist * 0.75); // ~0.75m per coordinate unit
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const midIdx = Math.floor(pathPoints.length / 2);
    const midPt = pathPoints[midIdx] || pathPoints[0];

    const newCable: CableRoute = {
      id: `cab-${Date.now()}`,
      code: code.trim() || `FO-${nextNum}`,
      name: name.trim() || `Kabel ${code}`,
      type,
      status,
      fromBuildingId: startBuilding?.id || 'custom-start',
      fromBuildingName: startBuilding?.name || 'Titik Lapangan A',
      toBuildingId: endBuilding?.id || 'custom-end',
      toBuildingName: endBuilding?.name || 'Titik Lapangan B',
      path: [...pathPoints],
      labelPos: midPt,
      totalCores,
      usedCores: Math.min(totalCores, Math.round(totalCores * 0.6)),
      lengthMeters: approxMeters,
      bandwidth,
      attenuationDb: 0.35,
      color: type === 'backbone' ? '#f97316' : type === 'fiber' ? '#06b6d4' : type === 'utp' ? '#10b981' : '#eab308'
    };

    onSave(newCable);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Simpan Jalur Kabel Baru
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pathPoints.length} titik koordinat rute berhasil digambar di denah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Route Connection summary banner */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-cyan-500/5 border-b border-cyan-500/10 flex items-center justify-between text-xs font-mono shrink-0">
          <span className="font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5 truncate max-w-[40%]">
            {startBuilding ? startBuilding.name : 'Titik A'}
          </span>
          <ArrowRight className="w-4 h-4 text-cyan-500 shrink-0" />
          <span className="font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5 truncate max-w-[40%]">
            {endBuilding ? endBuilding.name : 'Titik B'}
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-sans shrink-0">
            ~{approxMeters}m
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-3.5 sm:gap-4 text-xs overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kode Kabel</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="FO-006"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tipe Media</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CableType)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
              >
                <option value="fiber">Fiber Optic (FO)</option>
                <option value="backbone">Backbone Fiber</option>
                <option value="utp">UTP Cat6 / LAN</option>
                <option value="wireless">Wireless Bridge</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nama Rute Kabel</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Backbone FO: Kantor Utama → Gedung A"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Jumlah Core</label>
              <select
                value={totalCores}
                onChange={(e) => setTotalCores(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
              >
                <option value={4}>4 Core</option>
                <option value={8}>8 Core</option>
                <option value={12}>12 Core</option>
                <option value={24}>24 Core</option>
                <option value={48}>48 Core</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kapasitas Speed</label>
              <select
                value={bandwidth}
                onChange={(e) => setBandwidth(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
              >
                <option value="10 Gbps">10 Gbps</option>
                <option value="1 Gbps">1 Gbps</option>
                <option value="100 Mbps">100 Mbps</option>
                <option value="40 Gbps">40 Gbps</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Status Jalur</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CableStatus)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
              >
                <option value="active">Active (Normal)</option>
                <option value="degraded">Degraded</option>
                <option value="broken">Broken / Putus</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Aktifkan Rute</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
