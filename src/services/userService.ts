import { UserAccount, UserRole } from '../types/auth';

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  password?: string;
  department?: string;
  phone?: string;
  status?: 'active' | 'inactive';
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  role?: UserRole;
  department?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  avatarUrl?: string;
}

const FALLBACK_USERS: UserAccount[] = [
  {
    id: 'usr-1',
    username: 'admin',
    email: 'admin@cba-chemical.co.id',
    fullName: 'Admin IT CBA',
    role: 'ADMIN',
    status: 'active',
    department: 'IT Infrastructure & Security',
    phone: '+62 811-2345-6781',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    lastLogin: new Date().toISOString(),
    createdAt: '2024-01-01T08:00:00Z'
  },
  {
    id: 'usr-2',
    username: 'engineer',
    email: 'engineer@cba-chemical.co.id',
    fullName: 'Budi Santoso',
    role: 'IT_ENGINEER',
    status: 'active',
    department: 'Network & Systems Engineering',
    phone: '+62 812-3456-7892',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    lastLogin: new Date().toISOString(),
    createdAt: '2024-01-15T09:30:00Z'
  },
  {
    id: 'usr-3',
    username: 'viewer',
    email: 'viewer@cba-chemical.co.id',
    fullName: 'Operator Pabrik',
    role: 'VIEWER',
    status: 'active',
    department: 'Chemical Plant Operations',
    phone: '+62 813-4567-8903',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    lastLogin: new Date().toISOString(),
    createdAt: '2024-02-01T11:00:00Z'
  }
];

export const userService = {
  async getUsers(filters?: UserFilters): Promise<UserAccount[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search && filters.search.trim()) params.append('search', filters.search.trim());
      if (filters?.role && filters.role !== 'all') params.append('role', filters.role);
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
      return FALLBACK_USERS;
    } catch (err) {
      console.warn('[userService] Failed fetching users, using fallback:', err);
      let list = [...FALLBACK_USERS];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(u => 
          u.username.toLowerCase().includes(q) || 
          u.fullName.toLowerCase().includes(q) || 
          u.email.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q)
        );
      }
      if (filters?.role && filters.role !== 'all') {
        list = list.filter(u => u.role === filters.role);
      }
      if (filters?.status && filters.status !== 'all') {
        list = list.filter(u => u.status === filters.status);
      }
      return list;
    }
  },

  async getUserById(id: string): Promise<UserAccount | null> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.success ? json.data : null;
    } catch (err) {
      console.warn('[userService] getUserById error, checking fallback:', err);
      return FALLBACK_USERS.find(u => u.id === id || u.username === id) || null;
    }
  },

  async createUser(payload: CreateUserPayload, currentUserName = 'Admin IT', currentUserRole = 'ADMIN'): Promise<UserAccount> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-name': currentUserName,
        'x-user-role': currentUserRole
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menambahkan pengguna baru.');
    }
    return json.data;
  },

  async updateUser(id: string, payload: UpdateUserPayload, currentUserName = 'Admin IT', currentUserRole = 'ADMIN'): Promise<UserAccount> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-name': currentUserName,
        'x-user-role': currentUserRole
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal memperbarui pengguna.');
    }
    return json.data;
  },

  async resetPassword(id: string, newPassword: string, currentUserName = 'Admin IT', currentUserRole = 'ADMIN'): Promise<void> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-name': currentUserName,
        'x-user-role': currentUserRole
      },
      body: JSON.stringify({ newPassword })
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal mengatur ulang kata sandi.');
    }
  },

  async deleteUser(id: string, currentUserId = '', currentUserName = 'Admin IT', currentUserRole = 'ADMIN'): Promise<void> {
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': currentUserId,
        'x-user-name': currentUserName,
        'x-user-role': currentUserRole
      }
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal menghapus pengguna.');
    }
  }
};
