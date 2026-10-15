import React, { useState, useEffect } from 'react';
import { BuildingCategoryItem } from '../../types';
import { buildingCategoryService } from '../../services/buildingCategoryService';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  Building2, 
  AlertCircle, 
  Loader2, 
  Tag, 
  Palette,
  Sparkles
} from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelected?: (category: BuildingCategoryItem) => void;
  onCategoriesChanged?: (categories: BuildingCategoryItem[]) => void;
}

const COLOR_PRESETS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Slate', value: '#64748b' }
];

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onCategorySelected,
  onCategoriesChanged
}) => {
  const [categories, setCategories] = useState<BuildingCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slugId, setSlugId] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await buildingCategoryService.getCategories(true);
      setCategories(data);
      if (onCategoriesChanged) onCategoriesChanged(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setName('');
    setSlugId('');
    setColor('#3b82f6');
    setDescription('');
    setError(null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 32);
      setSlugId(autoSlug);
    }
  };

  const handleStartEdit = (cat: BuildingCategoryItem) => {
    setIsEditing(true);
    setEditId(cat.id);
    setName(cat.name);
    setSlugId(cat.id);
    setColor(cat.color || '#3b82f6');
    setDescription(cat.description || '');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama kategori wajib diisi');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (isEditing && editId) {
        const updated = await buildingCategoryService.updateCategory(editId, {
          name: name.trim(),
          color,
          description: description.trim()
        });
        setSuccessMsg(`Kategori "${updated.name}" berhasil diperbarui.`);
      } else {
        const created = await buildingCategoryService.createCategory({
          id: slugId.trim() || undefined,
          name: name.trim(),
          color,
          description: description.trim()
        });
        setSuccessMsg(`Kategori "${created.name}" berhasil ditambahkan.`);
        if (onCategorySelected) {
          onCategorySelected(created);
        }
      }

      await loadCategories();
      resetForm();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: BuildingCategoryItem) => {
    if (cat.buildingsCount && cat.buildingsCount > 0) {
      setError(`Kategori "${cat.name}" sedang digunakan oleh ${cat.buildingsCount} gedung dan tidak dapat dihapus.`);
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus kategori "${cat.name}"?`)) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await buildingCategoryService.deleteCategory(cat.id);
      setSuccessMsg(`Kategori "${cat.name}" berhasil dihapus.`);
      await loadCategories();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus kategori');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-cyan-400 border border-blue-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                Kelola Kategori Gedung
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur klasifikasi fungsi dan peruntukan gedung pabrik CBA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Feedback banners */}
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Create / Edit Section */}
          <div className="bg-slate-50 dark:bg-[#0E172F] p-4.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                {isEditing ? `Edit Kategori (${slugId})` : 'Tambah Kategori Baru'}
              </h4>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Kategori *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Contoh: Workshop & Pemeliharaan"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ID Kategori (Slug)
                  </label>
                  <input
                    type="text"
                    disabled={isEditing}
                    value={slugId}
                    onChange={(e) => setSlugId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_'))}
                    placeholder="workshop"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Color Swatch Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-400" />
                  Warna Indikator Kategori
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setColor(p.value)}
                      style={{ backgroundColor: p.value }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                        color === p.value ? 'scale-125 ring-2 ring-white dark:ring-slate-900 shadow-md' : 'opacity-85 hover:opacity-100 hover:scale-110'
                      }`}
                      title={p.name}
                    >
                      {color === p.value && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5 ml-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-[11px] font-mono text-slate-500 uppercase">{color}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deskripsi (Opsional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan fungsi atau zona gedung..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      {isEditing ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{isEditing ? 'Perbarui Kategori' : 'Tambah Kategori'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Categories Table/List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
              Daftar Kategori Aktif ({categories.length})
            </h4>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-xs">Memuat kategori...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Belum ada kategori yang terdaftar.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {categories.map((cat) => (
                  <div 
                    key={cat.id} 
                    className="p-3.5 flex items-center justify-between gap-3 bg-white dark:bg-[#0B132B] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span 
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                        style={{ backgroundColor: cat.color || '#3b82f6' }} 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {cat.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {cat.id}
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {cat.buildingsCount || 0} Gedung
                      </span>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Edit Kategori"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        disabled={Boolean(cat.buildingsCount && cat.buildingsCount > 0)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title={cat.buildingsCount && cat.buildingsCount > 0 ? "Kategori sedang digunakan gedung" : "Hapus Kategori"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Perubahan kategori langsung tersinkronisasi di seluruh formulir denah dan modul gedung.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
