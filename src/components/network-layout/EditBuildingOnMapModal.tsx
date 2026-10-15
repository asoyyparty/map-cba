import React, { useState, useEffect } from 'react';
import { Building, BuildingCategory, BuildingStatus, BuildingCategoryItem } from '../../types';
import { X, Building2, CheckCircle2, PenTool, Settings2, Check } from 'lucide-react';
import { buildingCategoryService } from '../../services/buildingCategoryService';
import { CategoryManagerModal } from '../buildings/CategoryManagerModal';

const PRESET_BUILDING_COLORS = [
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Biru', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Slate', hex: '#64748b' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Orange', hex: '#f97316' },
];

interface EditBuildingOnMapModalProps {
  isOpen: boolean;
  building: Building | null;
  onClose: () => void;
  onSave: (updated: Building) => void;
}

export const EditBuildingOnMapModal: React.FC<EditBuildingOnMapModalProps> = ({
  isOpen,
  building,
  onClose,
  onSave
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<BuildingCategory>('production');
  const [status, setStatus] = useState<BuildingStatus>('healthy');
  const [color, setColor] = useState<string>('#3b82f6');
  const [headIT, setHeadIT] = useState('');
  const [description, setDescription] = useState('');
  const [racksCount, setRacksCount] = useState(1);
  const [lokasi, setLokasi] = useState('Kawasan Pabrik CBA Cikande');

  // Dynamic categories
  const [categories, setCategories] = useState<BuildingCategoryItem[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      buildingCategoryService.getCategories().then(setCategories);
    }
  }, [isOpen]);

  useEffect(() => {
    if (building) {
      setCode(building.code || '');
      setName(building.name || '');
      setCategory(building.category || 'production');
      setStatus(building.status || 'healthy');
      setColor(building.color || '#3b82f6');
      setHeadIT(building.headIT || 'Tim IT CBA');
      setDescription(building.description || '');
      setRacksCount(building.racksCount || 1);
      setLokasi(building.lokasi || 'Kawasan Pabrik CBA Cikande');
    }
  }, [building]);

  if (!isOpen || !building) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: Building = {
      ...building,
      name: name.trim() || building.name,
      code: code.trim().toUpperCase() || building.code,
      category,
      status,
      color,
      headIT: headIT.trim() || building.headIT,
      description: description.trim(),
      racksCount: Number(racksCount) || 1,
      lokasi: lokasi.trim() || building.lokasi
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Edit Data Gedung {building.code}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah informasi dan konfigurasi gedung pada denah
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
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kode Gedung</label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 font-mono font-bold focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Kategori</label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  title="Kelola Daftar Kategori Gedung"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>Kelola</span>
                </button>
              </div>
              <select
                value={category}
                onChange={e => {
                  if (e.target.value === '__manage__') {
                    setIsCategoryModalOpen(true);
                  } else {
                    setCategory(e.target.value as BuildingCategory);
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-hidden cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option value="__manage__" className="text-amber-500 font-semibold">
                  + Kelola Kategori...
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Nama Gedung</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-hidden"
            />
          </div>

          {/* Warna Gedung */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#080D1A]/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs inline-block" style={{ backgroundColor: color }} />
                <span>Warna Gedung pada Denah & 3D</span>
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
              {PRESET_BUILDING_COLORS.map(p => (
                <button
                  key={p.hex}
                  type="button"
                  onClick={() => setColor(p.hex)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                    color.toLowerCase() === p.hex.toLowerCase()
                      ? 'ring-2 ring-amber-500 scale-110 border-white dark:border-slate-900 shadow-xs'
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Status Operasional</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as BuildingStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-hidden cursor-pointer"
              >
                <option value="healthy">Normal (Optimal)</option>
                <option value="warning">Peringatan (Degraded)</option>
                <option value="critical">Kritis (Down / Offline)</option>
                <option value="maintenance">Dalam Pemeliharaan</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">PIC / Penanggung Jawab IT</label>
              <input
                type="text"
                value={headIT}
                onChange={e => setHeadIT(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Jumlah Rak Server</label>
              <input
                type="number"
                min="0"
                max="20"
                value={racksCount}
                onChange={e => setRacksCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Lokasi Kawasan</label>
              <input
                type="text"
                value={lokasi}
                onChange={e => setLokasi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Deskripsi & Catatan Fasilitas</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 focus:border-amber-500 focus:outline-hidden resize-none"
            />
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
              className="px-5 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategorySelected={(newCat) => {
          setCategory(newCat.id as any);
          buildingCategoryService.getCategories().then(setCategories);
        }}
        onCategoriesChanged={(cats) => {
          setCategories(cats);
        }}
      />
    </div>
  );
};
