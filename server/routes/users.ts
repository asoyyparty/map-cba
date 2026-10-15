import { Router } from 'express';
import type { Response } from 'express';
import { db, logAuditEvent } from '../db/database.ts';
import { hashPassword } from '../services/authService.ts';
import {
  authenticateToken,
  requireRole,
  normalizeRole,
  type AuthenticatedRequest
} from '../middleware/authMiddleware.ts';

export const usersRouter = Router();

// Apply authentication to ALL user routes
usersRouter.use(authenticateToken);

function denormalizeRole(role: string): string {
  const r = (role || '').toUpperCase().trim();
  if (r === 'ADMIN') return 'admin';
  if (r === 'IT_ENGINEER') return 'engineer';
  return 'viewer';
}

// GET /api/users - List users with filtering (Accessible to authenticated users)
usersRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, role, status } = req.query;
    let sql = `
      SELECT id, username, email, full_name, role, status, department, phone, avatar_url, last_login, created_at 
      FROM users 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(username) LIKE ? OR LOWER(email) LIKE ? OR LOWER(full_name) LIKE ? OR LOWER(department) LIKE ?)`;
      params.push(q, q, q, q);
    }

    if (role && typeof role === 'string' && role !== 'all') {
      const dbRole = denormalizeRole(role);
      sql += ` AND LOWER(role) = ?`;
      params.push(dbRole);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      sql += ` AND LOWER(status) = ?`;
      params.push(status.toLowerCase().trim());
    }

    sql += ` ORDER BY created_at DESC;`;

    const rows = await db.query(sql, params);
    const data = rows.map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email || `${u.username}@cba-chemical.co.id`,
      fullName: u.full_name,
      role: normalizeRole(u.role),
      status: u.status || 'active',
      department: u.department || 'IT & Automation',
      phone: u.phone || '-',
      avatarUrl: u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      lastLogin: u.last_login || null,
      createdAt: u.created_at
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/:id - Single user
usersRouter.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const u = await db.queryOne(
      `SELECT id, username, email, full_name, role, status, department, phone, avatar_url, last_login, created_at 
       FROM users WHERE id = ? OR username = ? LIMIT 1;`,
      [id, id]
    );

    if (!u) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    res.json({
      success: true,
      data: {
        id: u.id,
        username: u.username,
        email: u.email || `${u.username}@cba-chemical.co.id`,
        fullName: u.full_name,
        role: normalizeRole(u.role),
        status: u.status || 'active',
        department: u.department || 'IT & Automation',
        phone: u.phone || '-',
        avatarUrl: u.avatar_url,
        lastLogin: u.last_login,
        createdAt: u.created_at
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users - Create new user (ADMIN ONLY)
usersRouter.post('/', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      username,
      email,
      fullName,
      role = 'VIEWER',
      password = 'cbaPassword123!',
      department = 'IT & Automation',
      phone = '',
      status = 'active',
      avatarUrl
    } = req.body;

    const operatorUser = req.user?.username || 'admin';
    const operatorRole = req.user?.role || 'ADMIN';

    // Validation
    if (!username || !String(username).trim()) {
      return res.status(400).json({ success: false, message: 'Username wajib diisi.' });
    }
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ success: false, message: 'Nama lengkap wajib diisi.' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Kata sandi minimal 8 karakter demi keamanan.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanEmail = String(email || `${cleanUsername}@cba-chemical.co.id`).trim().toLowerCase();

    // Check duplicate username or email
    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE LOWER(username) = ? OR LOWER(email) = ? LIMIT 1;',
      [cleanUsername, cleanEmail]
    );
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username atau Email sudah terdaftar dalam sistem.'
      });
    }

    // Hash password with scrypt
    const hashedPassword = hashPassword(String(password));
    const newId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const dbRole = denormalizeRole(role);
    const defaultAvatar = avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;

    await db.query(`
      INSERT INTO users (id, username, email, password, full_name, role, status, department, phone, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `, [
      newId,
      cleanUsername,
      cleanEmail,
      hashedPassword,
      String(fullName).trim(),
      dbRole,
      status || 'active',
      String(department).trim(),
      String(phone).trim(),
      defaultAvatar
    ]);

    // Audit log
    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'CREATE_USER',
      entity: 'users',
      entityId: newId,
      details: { username: cleanUsername, email: cleanEmail, role: normalizeRole(dbRole), department }
    });

    res.status(201).json({
      success: true,
      message: `Akun pengguna ${cleanUsername} berhasil dibuat.`,
      data: {
        id: newId,
        username: cleanUsername,
        email: cleanEmail,
        fullName: String(fullName).trim(),
        role: normalizeRole(dbRole),
        status: status || 'active',
        department: String(department).trim(),
        phone: String(phone).trim(),
        avatarUrl: defaultAvatar
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/users/:id - Update user profile
usersRouter.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      email,
      role,
      department,
      phone,
      status,
      avatarUrl
    } = req.body;

    const operatorId = req.user?.sub;
    const operatorRole = req.user?.role || 'VIEWER';
    const operatorUser = req.user?.username || 'user';

    const isSelf = operatorId === id;
    const isAdmin = operatorRole === 'ADMIN';

    // Only Admin can update other users, or update sensitive fields (role, status)
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Hanya Administrator yang berhak mengubah data pengguna lain.'
      });
    }

    if (!isAdmin && (role !== undefined || status !== undefined)) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Hanya Administrator yang berhak mengubah peran (role) dan status akun.'
      });
    }

    // Verify existing user
    const existing = await db.queryOne('SELECT * FROM users WHERE id = ? LIMIT 1;', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    // Protection: Prevent demoting or deactivating the last active ADMIN
    if (existing.role === 'admin' && ((role && denormalizeRole(role) !== 'admin') || status === 'inactive')) {
      const [adminCountRow]: any = await db.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND status = 'active';"
      );
      const activeAdminCount = adminCountRow[0]?.count || 1;
      if (activeAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Gagal mengubah peran/status: Sistem harus memiliki setidaknya satu Administrator aktif.'
        });
      }
    }

    // Check duplicate email if changed
    if (email && email.toLowerCase() !== (existing.email || '').toLowerCase()) {
      const duplicateEmail = await db.queryOne(
        'SELECT id FROM users WHERE LOWER(email) = ? AND id != ? LIMIT 1;',
        [email.trim().toLowerCase(), id]
      );
      if (duplicateEmail) {
        return res.status(400).json({ success: false, message: 'Email sudah digunakan oleh pengguna lain.' });
      }
    }

    const updatedFullName = fullName !== undefined ? String(fullName).trim() : existing.full_name;
    const updatedEmail = email !== undefined ? String(email).trim().toLowerCase() : existing.email;
    const updatedRole = role !== undefined && isAdmin ? denormalizeRole(role) : existing.role;
    const updatedDept = department !== undefined ? String(department).trim() : existing.department;
    const updatedPhone = phone !== undefined ? String(phone).trim() : existing.phone;
    const updatedStatus = status !== undefined && isAdmin ? status : existing.status;
    const updatedAvatar = avatarUrl !== undefined ? avatarUrl : existing.avatar_url;

    await db.query(`
      UPDATE users SET 
        full_name = ?,
        email = ?,
        role = ?,
        department = ?,
        phone = ?,
        status = ?,
        avatar_url = ?
      WHERE id = ?;
    `, [
      updatedFullName,
      updatedEmail,
      updatedRole,
      updatedDept,
      updatedPhone,
      updatedStatus,
      updatedAvatar,
      id
    ]);

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'UPDATE_USER',
      entity: 'users',
      entityId: id,
      details: {
        username: existing.username,
        roleChanged: existing.role !== updatedRole,
        newRole: normalizeRole(updatedRole),
        status: updatedStatus
      }
    });

    res.json({
      success: true,
      message: `Profil pengguna ${existing.username} berhasil diperbarui.`,
      data: {
        id,
        username: existing.username,
        fullName: updatedFullName,
        email: updatedEmail,
        role: normalizeRole(updatedRole),
        department: updatedDept,
        phone: updatedPhone,
        status: updatedStatus,
        avatarUrl: updatedAvatar
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/users/:id/password - Reset / change password
usersRouter.put('/:id/password', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const operatorId = req.user?.sub;
    const operatorRole = req.user?.role || 'VIEWER';
    const operatorUser = req.user?.username || 'user';

    const isSelf = operatorId === id;
    const isAdmin = operatorRole === 'ADMIN';

    // Only Admin can reset another user's password; non-admin can only change their own
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak: Anda hanya dapat mengubah kata sandi akun Anda sendiri.'
      });
    }

    if (!newPassword || String(newPassword).trim().length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Kata sandi baru minimal 8 karakter demi standar keamanan.'
      });
    }

    const existing = await db.queryOne('SELECT id, username FROM users WHERE id = ? LIMIT 1;', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    // Hash password with scrypt
    const hashedPassword = hashPassword(String(newPassword).trim());
    await db.query('UPDATE users SET password = ? WHERE id = ?;', [hashedPassword, id]);

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'RESET_PASSWORD',
      entity: 'users',
      entityId: id,
      details: { username: existing.username, note: `Kata sandi diubah oleh ${operatorUser} (${operatorRole})` }
    });

    res.json({
      success: true,
      message: `Kata sandi untuk pengguna ${existing.username} berhasil diperbarui dengan hashing aman.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:id - Delete user (ADMIN ONLY)
usersRouter.delete('/:id', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const operatorId = req.user?.sub || '';
    const operatorUser = req.user?.username || 'admin';
    const operatorRole = req.user?.role || 'ADMIN';

    const existing = await db.queryOne('SELECT * FROM users WHERE id = ? LIMIT 1;', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }

    // Safety 1: Cannot delete own account
    if (operatorId && operatorId === id) {
      return res.status(400).json({
        success: false,
        message: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk.'
      });
    }

    // Safety 2: Cannot delete root administrator (usr-1 / admin)
    if (existing.username === 'admin' || existing.id === 'usr-1') {
      return res.status(400).json({
        success: false,
        message: 'Akun Root Administrator sistem (admin) tidak dapat dihapus.'
      });
    }

    // Safety 3: Cannot delete if it is the last admin
    if (existing.role === 'admin') {
      const [adminCountRow]: any = await db.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin';"
      );
      const adminCount = adminCountRow[0]?.count || 1;
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Tidak dapat menghapus Administrator terakhir di sistem.'
        });
      }
    }

    await db.query('DELETE FROM users WHERE id = ?;', [id]);

    await logAuditEvent({
      username: operatorUser,
      userRole: operatorRole,
      action: 'DELETE_USER',
      entity: 'users',
      entityId: id,
      details: { username: existing.username, fullName: existing.full_name, role: existing.role }
    });

    res.json({
      success: true,
      message: `Pengguna ${existing.username} (${existing.full_name}) berhasil dihapus dari sistem.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
