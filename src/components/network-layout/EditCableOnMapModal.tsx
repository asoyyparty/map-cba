import React, { useState, useEffect } from 'react';
import { CableRoute, CableType, CableStatus, Building } from '../../types';
import { X, Network, CheckCircle2, GitFork, ArrowRight, PenTool, Check, Layers } from 'lucide-react';

const PRESET_CABLE_COLORS = [
  { name: 'Cyan (FO Default)', hex: '#06b6d4' },
  { name: 'Orange (Backbone)', hex: '#f97316' },
  { name: 'Green (UTP/Ethernet)', hex: '#10b981' },
  { name: 'Amber (Backup)', hex: '#eab308' },
  { name: 'Blue (Trunk)', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Red (Critical)', hex: '#dc2626' },
  { name: 'Slate', hex: '#64748b' }
];

interface EditCableOnMapModalProps {
  isOpen: boolean;
  cable: CableRoute | null;
  buildings: Building[];
  onClose: () => void;
  onSave: (updated: CableRoute) => void;
  onRedrawPath?: (cable: CableRoute) => void;
}

export const EditCableOnMapModal: React.FC<EditCableOnMapModalProps> = ({
  isOpen,
  cable,
  buildings,
  onClose,
  onSave,
  onRedrawPath
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<CableType>('fiber');
  const [status, setStatus] = useState<CableStatus>('active');
  const [color, setColor] = useState<string>('#06b6d4');
  const [fromBuildingId, setFromBuildingId] = useState('');
  const [toBuildingId, setToBuildingId] = useState('');
  const [totalCores, setTotalCores] = useState<number>(12);
  const [bandwidth, setBandwidth] = useState<string>('10 Gbps');
  const [lengthMeters, setLengthMeters] = useState<number>(100);

  useEffect(() => {
    if (cable) {
      setCode(cable.code || '');
      setName(cable.name || '');
      setType(cable.type || 'fiber');
      setStatus(cable.status || 'active');
      setColor(
        cable.color ||
        (cable.type === 'backbone' ? '#f97316' : cable.type === 'fiber' ? '#06b6d4' : cable.type === 'utp' ? '#10b981' : '#eab308')
      );
      setFromBuildingId(cable.fromBuildingId || '');
      setToBuildingId(cable.toBuildingId || '');
      setTotalCores(cable.totalCores || 12);
      setBandwidth(cable.bandwidth || '10 Gbps');
      setLengthMeters(cable.lengthMeters || 100);
    }
  }, [cable]);

  if (!isOpen || !cable) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fromBld = buildings.find(b => b.id === fromBuildingId);
    const toBld = buildings.find(b => b.id === toBuildingId);

    const updated: CableRoute = {
      ...cable,
      code: code.trim().toUpperCase() || cable.code,
      name: name.trim() || cable.name,
      type,
      status,
      color,
      fromBuildingId: fromBuildingId || cable.fromBuildingId,
      fromBuildingName: fromBld?.name || cable.fromBuildingName || 'Titik Asal',
      toBuildingId: toBuildingId || cable.toBuildingId,
      toBuildingName: toBld?.name || cable.toBuildingName || 'Titik Tujuan',
      totalCores: Number(totalCores) || cable.totalCores,
      bandwidth: bandwidth.trim() || cable.bandwidth,
      lengthMeters: Number(lengthMeters) || cable.lengthMeters
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl border shadow-xs"
              style={{
                backgroundColor: `${color}15`,
                borderColor: `${color}40`,
                color: color
              }}
            >
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Edit Jalur Kabel {cable.code}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah informasi rute, jenis kabel, kapasitas, dan warna garis denah
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-3.5 sm:gap-4 text-xs overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kode Rute Kabel</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 font-mono font-bold focus:border-cyan-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tipe Media Kabel</label>
              <select
                value={type}
                onChange={e => {
                  const newType = e.target.value as CableType;
                  setType(newType);
                  // Suggest matching color if not customized
                  if (newType === 'backbone') setColor('#f97316');
                  else if (newType === 'fiber') setColor('#06b6d4');
                  else if (newType === 'utp') setColor('#10b981');
                  else if (newType === 'wireless') setColor('#eab308');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-hidden cursor-pointer"
              >
                <option value="fiber">Fiber Optic (FO Multi/Single Core)</option>
                <option value="backbone">Backbone Trunk (High Capacity)</option>
                <option value="utp">UTP / STP Ethernet</option>
                <option value="wireless">Wireless Bridge PTP</option>
                <option value="backup">Jalur Cadangan / Standby</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nama Jalur / Rute Deskriptif</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-hidden"
            />
          </div>

          {/* Warna Garis Kabel */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080D1A]/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs inline-block" style={{ backgroundColor: color }} />
                <span>Warna Garis Kabel pada Denah</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-bold uppercase">{color}</span>
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-6 h-6 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer p-0 bg-transparent"
                  title="Pilih warna kustom"
                />
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_CABLE_COLORS.map(p => (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => setColor(p.hex)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                    color.toLowerCase() === p.hex.toLowerCase()
                      ? 'ring-2 ring-cyan-500 scale-110 border-white dark:border-slate-900 shadow-xs'
                      : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: p.hex }}
                  title={p.name}
                >
                  {color.toLowerCase() === p.hex.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Gedung Asal & Tujuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Gedung Asal (From)</label>
              <select
                value={fromBuildingId}
                onChange={e => setFromBuildingId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-hidden cursor-pointer"
              >
                <option value="">-- Pilih Gedung Asal --</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Gedung Tujuan (To)</label>
              <select
                value={toBuildingId}
                onChange={e => setToBuildingId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-hidden cursor-pointer"
              >
                <option value="">-- Pilih Gedung Tujuan --</option>
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Status Jalur</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as CableStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-hidden cursor-pointer"
              >
                <option value="active">Active (Normal)</option>
                <option value="normal">Normal</option>
                <option value="degraded">Degraded (Redaman Tinggi)</option>
                <option value="broken">Broken (Putus / Rusak)</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Total Core FO</label>
              <select
                value={totalCores}
                onChange={e => setTotalCores(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-hidden cursor-pointer"
              >
                <option value={4}>4 Core</option>
                <option value={6}>6 Core</option>
                <option value={8}>8 Core</option>
                <option value={12}>12 Core</option>
                <option value={24}>24 Core</option>
                <option value={48}>48 Core</option>
                <option value={96}>96 Core</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Bandwidth</label>
              <input
                type="text"
                value={bandwidth}
                onChange={e => setBandwidth(e.target.value)}
                placeholder="10 Gbps"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Panjang Estimasi (Meter)</label>
              <input
                type="number"
                min={1}
                value={lengthMeters}
                onChange={e => setLengthMeters(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-cyan-500 focus:outline-hidden font-mono"
              />
            </div>

            <div className="flex flex-col justify-end">
              {onRedrawPath && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRedrawPath(cable);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Klik untuk menggambar ulang rute jalur kabel di atas denah"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Gambar Ulang Jalur di Denah</span>
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Perubahan Kabel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
