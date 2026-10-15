import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService.ts';
import type { JwtPayload } from '../services/authService.ts';

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Role-to-Permissions Mapping (Server-side Source of Truth)
export const SERVER_ROLE_PERMISSIONS: Record<string, string[]> = {
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

export function normalizeRole(role: string): string {
  const r = (role || '').toLowerCase().trim();
  if (r === 'admin') return 'ADMIN';
  if (r === 'engineer' || r === 'it_engineer') return 'IT_ENGINEER';
  return 'VIEWER';
}

/**
 * Middleware to authenticate requests using JWT Bearer Token.
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query?.token && typeof req.query.token === 'string') {
    // Query parameter token fallback (e.g. for SSE streams or file exports)
    token = req.query.token.trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak: Autentikasi diperlukan. Silakan login kembali.'
    });
  }

  const result = verifyToken(token);
  if (!result.valid || !result.payload) {
    return res.status(401).json({
      success: false,
      message: result.error || 'Sesi tidak valid atau telah kadaluarsa. Silakan login kembali.'
    });
  }

  req.user = result.payload;
  next();
}

/**
 * Middleware to check if authenticated user possesses one of the allowed roles.
 */
export function requireRole(...allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Sesi belum terautentikasi.'
      });
    }

    const userRole = normalizeRole(req.user.role);
    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak: Peran '${userRole}' tidak memiliki izin untuk melakukan tindakan ini. Diperlukan peran: ${allowedRoles.join(', ')}.`
      });
    }

    next();
  };
}

/**
 * Middleware to check if authenticated user possesses a specific permission.
 */
export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak: Sesi belum terautentikasi.'
      });
    }

    const userRole = normalizeRole(req.user.role);
    const userPermissions = SERVER_ROLE_PERMISSIONS[userRole] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak: Peran '${userRole}' tidak memiliki hak akses '${permission}'.`
      });
    }

    next();
  };
}
