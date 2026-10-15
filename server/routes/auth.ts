import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../db/database.ts';
import {
  verifyPassword,
  hashPassword,
  signToken,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit
} from '../services/authService.ts';
import {
  authenticateToken,
  requireRole,
  normalizeRole,
  SERVER_ROLE_PERMISSIONS,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const authRouter = Router();

// Helper to get client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

// POST /api/auth/login - Secure login with scrypt hashing, JWT issuance & anti brute-force
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const rawIdentifier = req.body.identifier || req.body.username || req.body.email || '';
    const identifier = String(rawIdentifier).trim().toLowerCase();
    const password = String(req.body.password || '');
    const rememberMe = req.body.rememberMe === true;

    const clientIp = getClientIp(req);
    const rateLimitKey = `${clientIp}_${identifier || 'anon'}`;

    // 1. Check Anti Brute-Force Rate Limit
    const rateLimit = checkLoginRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: `Terlalu banyak percobaan login yang gagal. Akun sementara dikunci selama ${rateLimit.retryAfterSeconds} detik demi keamanan.`,
        retryAfter: rateLimit.retryAfterSeconds
      });
    }

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Username atau Email wajib diisi.' });
    }

    if (!password) {
      return res.status(400).json({ success: false, message: 'Kata sandi wajib diisi.' });
    }

    // 2. Find user in MySQL database
    const user = await db.queryOne(
      'SELECT id, username, email, password, full_name, role, status, avatar_url FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1;',
      [identifier, identifier]
    );

    if (!user) {
      const record = recordFailedLogin(rateLimitKey);
      const attemptWarning = record.isLocked
        ? 'Akun telah dikunci sementara selama 15 menit karena terlalu banyak percobaan gagal.'
        : `Sisa percobaan: ${record.remainingAttempts} kali sebelum akun dikunci.`;

      return res.status(401).json({
        success: false,
        message: `Kredensial login tidak valid. Silakan periksa kembali. (${attemptWarning})`,
        remainingAttempts: record.remainingAttempts
      });
    }

    // 3. Check account active status
    if (user.status && user.status.toLowerCase() === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda sedang dinonaktifkan oleh Administrator. Hubungi IT Helpdesk.'
      });
    }

    // 4. Verify password with scrypt & auto-upgrade legacy plaintext
    const { valid: isPasswordValid, needsRehash } = verifyPassword(password, user.password || '');

    if (!isPasswordValid) {
      const record = recordFailedLogin(rateLimitKey);
      const attemptWarning = record.isLocked
        ? 'Akun telah dikunci sementara selama 15 menit karena terlalu banyak percobaan gagal.'
        : `Sisa percobaan: ${record.remainingAttempts} kali sebelum akun dikunci.`;

      return res.status(401).json({
        success: false,
        message: `Kata sandi salah. Silakan periksa kembali. (${attemptWarning})`,
        remainingAttempts: record.remainingAttempts
      });
    }

    // 5. Successful authentication -> clear rate limit
    clearLoginRateLimit(rateLimitKey);

    // Auto-upgrade legacy plaintext password to secure scrypt hash in background
    if (needsRehash) {
      try {
        const secureHash = hashPassword(password);
        await db.query('UPDATE users SET password = ? WHERE id = ?;', [secureHash, user.id]);
        console.log(`[Security] Automatically upgraded password for user '${user.username}' to scrypt hash.`);
      } catch (hashErr: any) {
        console.warn('[Security] Notice updating user hash:', hashErr.message);
      }
    }

    // Update last_login timestamp in MySQL
    try {
      await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?;', [user.id]);
    } catch {}

    const standardRole = normalizeRole(user.role);
    const expiresInSeconds = rememberMe ? 7 * 24 * 3600 : 24 * 3600; // 7 days if remember-me, else 24 hours

    const tokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email || `${user.username}@cba-chemical.co.id`,
      role: standardRole,
      fullName: user.full_name
    };

    // 6. Sign JWT token
    const token = signToken(tokenPayload, expiresInSeconds);

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email || `${user.username}@cba-chemical.co.id`,
      fullName: user.full_name,
      role: standardRole,
      permissions: SERVER_ROLE_PERMISSIONS[standardRole] || [],
      site: 'PT. CBA Chemical Industry',
      avatarUrl: user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      lastLogin: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      data: userData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Kesalahan internal server: ' + err.message });
  }
});

// GET /api/auth/me - Verify current JWT session and return latest user profile & permissions
authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Sesi belum terautentikasi.' });
    }

    const user = await db.queryOne(
      'SELECT id, username, email, full_name, role, status, department, phone, avatar_url, last_login, created_at FROM users WHERE id = ? LIMIT 1;',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan dalam sistem.' });
    }

    if (user.status && user.status.toLowerCase() === 'inactive') {
      return res.status(403).json({ success: false, message: 'Akun Anda sedang dinonaktifkan.' });
    }

    const standardRole = normalizeRole(user.role);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email || `${user.username}@cba-chemical.co.id`,
        fullName: user.full_name,
        role: standardRole,
        permissions: SERVER_ROLE_PERMISSIONS[standardRole] || [],
        status: user.status || 'active',
        department: user.department || 'IT & Automation',
        phone: user.phone || '-',
        site: 'PT. CBA Chemical Industry',
        avatarUrl: user.avatar_url,
        lastLogin: user.last_login
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/users - List users (Protected: ADMIN only)
authRouter.get('/users', authenticateToken, requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await db.query('SELECT id, username, email, full_name, role, status, department, phone, avatar_url, last_login, created_at FROM users ORDER BY created_at DESC;');
    res.json({
      success: true,
      data: users.map((u: any) => ({
        ...u,
        role: normalizeRole(u.role)
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
