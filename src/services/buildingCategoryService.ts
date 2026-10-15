import { BuildingCategoryItem } from '../types';

const DEFAULT_CATEGORIES: BuildingCategoryItem[] = [
  { id: 'production', name: 'Produksi Kimia (Production)', color: '#10b981', description: 'Fasilitas manufaktur, sintesis, formulasi, dan packaging kimia', isDefault: true },
  { id: 'warehouse', name: 'Gudang Logistik (Warehouse)', color: '#f59e0b', description: 'Gudang penyimpanan bahan baku, barang jadi, dan logistik distribusi', isDefault: true },
  { id: 'office', name: 'Kantor / Administrasi (Office)', color: '#3b82f6', description: 'Gedung kantor pusat, administrasi, manajemen, HRD, dan keuangan', isDefault: true },
  { id: 'lab', name: 'Laboratorium & QC (Lab)', color: '#8b5cf6', description: 'Laboratorium penelitian dan pengembangan (R&D) serta kontrol kualitas QA/QC', isDefault: true },
  { id: 'utility', name: 'Utilitas & WTP (Utility)', color: '#06b6d4', description: 'Gardu listrik PLN, genset, chiller, boiler, dan instalasi pengolahan air WTP', isDefault: true },
  { id: 'security', name: 'Pos Pengamanan (Security)', color: '#f97316', description: 'Pos jaga satpam gerbang utama dan pos pengawasan perimeter', isDefault: true }
];

const LOCAL_STORAGE_KEY = 'cba_building_categories_v1';

class BuildingCategoryService {
  private cache: BuildingCategoryItem[] = [...DEFAULT_CATEGORIES];
  private isLoaded = false;

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cache = parsed;
        }
      }
    } catch {}
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.cache));
    } catch {}
  }

  async getCategories(forceRefresh = false): Promise<BuildingCategoryItem[]> {
    if (this.isLoaded && !forceRefresh && this.cache.length > 0) {
      return this.cache;
    }

    this.loadFromStorage();

    try {
      const res = await fetch('/api/buildings/categories');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          this.cache = json.data;
          this.isLoaded = true;
          this.saveToStorage();
          return this.cache;
        }
      }
    } catch (err) {
      console.warn('[buildingCategoryService] Failed fetching categories from API, using cached data:', err);
    }

    this.isLoaded = true;
    return this.cache;
  }

  async createCategory(data: { name: string; id?: string; color?: string; description?: string }): Promise<BuildingCategoryItem> {
    try {
      const res = await fetch('/api/buildings/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal menambahkan kategori');
      }

      const created: BuildingCategoryItem = json.data;
      this.cache = [...this.cache, created];
      this.saveToStorage();
      return created;
    } catch (err: any) {
      // Local fallback in case offline
      const id = data.id || data.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fallbackItem: BuildingCategoryItem = {
        id,
        name: data.name,
        color: data.color || '#3b82f6',
        description: data.description || '',
        isDefault: false,
        buildingsCount: 0
      };
      this.cache = [...this.cache.filter(c => c.id !== id), fallbackItem];
      this.saveToStorage();
      return fallbackItem;
    }
  }

  async updateCategory(id: string, data: Partial<BuildingCategoryItem>): Promise<BuildingCategoryItem> {
    try {
      const res = await fetch(`/api/buildings/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal memperbarui kategori');
      }

      const updated: BuildingCategoryItem = json.data;
      this.cache = this.cache.map(c => c.id === id ? { ...c, ...updated } : c);
      this.saveToStorage();
      return updated;
    } catch (err: any) {
      this.cache = this.cache.map(c => c.id === id ? { ...c, ...data } : c);
      this.saveToStorage();
      return this.cache.find(c => c.id === id)!;
    }
  }

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`/api/buildings/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menghapus kategori');
    }

    this.cache = this.cache.filter(c => c.id !== id);
    this.saveToStorage();
  }
}

export const buildingCategoryService = new BuildingCategoryService();
