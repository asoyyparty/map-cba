import React, { useState, useEffect } from 'react';
import { Building, Point, BuildingCategory, BuildingStatus, BuildingCategoryItem } from '../../types';
import { X, Building2, CheckCircle2, MapPin, Settings2, Tag, Check } from 'lucide-react';
import { getNextBuildingCode } from '../../utils/buildingCodeHelper';
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

interface AddBuildingOnMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (building: Building) => void;
  polygonPoints: Point[];
  existingBuildings?: Building[];
  existingBuildingsCount?: number;
}

export const AddBuildingOnMapModal: React.FC<AddBuildingOnMapModalProps> = ({
  isOpen,
  onClose,
  onSave,
  polygonPoints,
  existingBuildings = [],
  existingBuildingsCount
}) => {
  const [code, setCode] = useState('GD-A');
  const [name, setName] = useState('Gedung A');
  const [category, setCategory] = useState<BuildingCategory>('production');
  const [status, setStatus] = useState<BuildingStatus>('healthy');
  const [color, setColor] = useState<string>('#3b82f6');
  const [headIT, setHeadIT] = useState('Tim IT Infrastruktur CBA');
  const [description, setDescription] = useState('Fasilitas operasional baru pabrik CBA Cikande.');

  // Category management
  const [categories, setCategories] = useState<BuildingCategoryItem[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Automatically recalculate next sequential code and fetch categories when modal opens
  useEffect(() => {
    if (isOpen) {
      const nextCode = getNextBuildingCode(existingBuildings);
      setCode(nextCode);
      setName(`Gedung ${nextCode.replace('GD-', '')}`);

      buildingCategoryService.getCategories().then(cats => {
        setCategories(cats);
        if (cats.length > 0 && (!category || !cats.some(c => c.id === category))) {
          setCategory(cats[0].id as any);
        }
      });
    }
  }, [isOpen, existingBuildings]);

  if (!isOpen) return null;

  // Calculate center coordinate
  let centerX = 200;
  let centerY = 200;
  if (polygonPoints.length > 0) {
    const sumX = polygonPoints.reduce((acc, pt) => acc + pt.x, 0);
    const sumY = polygonPoints.reduce((acc, pt) => acc + pt.y, 0);
    centerX = Math.round(sumX / polygonPoints.length);
    centerY = Math.round(sumY / polygonPoints.length);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newBuilding: Building = {
      id: `bld-${Date.now()}`,
      name: name.trim() || `Gedung ${code.trim().toUpperCase()}`,
      code: code.trim().toUpperCase() || 'GD-A',
      category,
      polygon: [...polygonPoints],
      center: { x: centerX, y: centerY },
      status,
      color,
      headIT: headIT.trim() || 'Tim IT CBA',
      totalDevices: 1,
      racksCount: 1,
      description: description.trim(),
      lokasi: 'Kawasan Pabrik CBA Cikande',
      koordinat: `X: ${centerX}, Y: ${centerY}`,
      apCount: 2,
      portCount: 24,
      connectedUsers: 10
    };

    onSave(newBuilding);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Tambah Gedung Baru
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Poligon {polygonPoints.length} titik sudut di koordinat X: {centerX}, Y: {centerY}
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
                onChange={(e) => setCode(e.target.value)}
                placeholder="GD-K"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 dark:text-slate-300 font-semibold">Kategori Fungsi</label>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="text-[11px] text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Kelola Daftar Kategori Gedung"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>Kelola</span>
                </button>
              </div>
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === '__manage__') {
                    setIsCategoryModalOpen(true);
                  } else {
                    setCategory(e.target.value as BuildingCategory);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
                <option value="__manage__" className="text-blue-500 font-semibold">
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
              onChange={(e) => setName(e.target.value)}
              placeholder="Gedung K - Formulasi Khusus"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
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
                      ? 'ring-2 ring-emerald-500 scale-110 border-white dark:border-slate-900 shadow-xs'
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
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Penanggung Jawab / PIC</label>
              <input
                type="text"
                value={headIT}
                onChange={(e) => setHeadIT(e.target.value)}
                placeholder="Nama PIC IT"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Status Operasional</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BuildingStatus)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
              >
                <option value="healthy">Healthy (Normal)</option>
                <option value="warning">Warning / Maintenance</option>
                <option value="critical">Critical / Incident</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Deskripsi Fasilitas</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi kegiatan atau peralatan di gedung ini..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 resize-none"
            />
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Tampilkan Gedung</span>
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
