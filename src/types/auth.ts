export type UserRole = 'ADMIN' | 'IT_ENGINEER' | 'VIEWER';

export type Permission = 
  | 'infrastructure:read'
  | 'infrastructure:manage'
  | 'maintenance:read'
  | 'maintenance:manage'
  | 'monitoring:read'
  | 'monitoring:manage'
  | 'reports:read'
  | 'reports:export'
  | 'settings:read'
  | 'settings:manage'
  | 'users:manage';

export interface AuthUser {
  id: string;
  username?: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  site: string;
  lastLogin?: string;
  permissions?: Permission[];
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: 'active' | 'inactive';
  department: string;
  phone: string;
  avatarUrl?: string;
  lastLogin?: string | null;
  createdAt: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'infrastructure:read',
    'infrastructure:manage',
    'maintenance:read',
    'maintenance:manage',
    'monitoring:read',
    'monitoring:manage',
    'reports:read',
    'reports:export',
    'settings:read',
    'settings:manage',
    'users:manage'
  ],
  IT_ENGINEER: [
    'infrastructure:read',
    'infrastructure:manage',
    'maintenance:read',
    'maintenance:manage',
    'monitoring:read',
    'monitoring:manage',
    'reports:read',
    'reports:export',
    'settings:read'
  ],
  VIEWER: [
    'infrastructure:read',
    'maintenance:read',
    'monitoring:read',
    'reports:read',
    'settings:read'
  ]
};

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  badgeClass: string;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  ADMIN: {
    role: 'ADMIN',
    label: 'Administrator',
    description: 'Full administrative access to all network infrastructure and settings.',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  IT_ENGINEER: {
    role: 'IT_ENGINEER',
    label: 'IT Engineer',
    description: 'Can manage and modify network infrastructure, cables, racks, and maintenance.',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  VIEWER: {
    role: 'VIEWER',
    label: 'Viewer',
    description: 'Read-only access to view network map, devices, topology, and reports.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200'
  }
};
