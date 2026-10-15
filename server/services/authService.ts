import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// --- JWT Secret Management (Multi-tiered Fallback) ---
const SECRET_FILE = path.join(process.cwd(), '.jwt_secret');

function getJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }

  try {
    if (fs.existsSync(SECRET_FILE)) {
      const savedSecret = fs.readFileSync(SECRET_FILE, 'utf-8').trim();
      if (savedSecret.length >= 32) return savedSecret;
    }
  } catch (err) {
    console.warn('[Security] Could not read secret file:', err);
  }

  // Generate cryptographically secure 64-character hex secret
  const generatedSecret = crypto.randomBytes(32).toString('hex');
  try {
    fs.writeFileSync(SECRET_FILE, generatedSecret, { encoding: 'utf-8', mode: 0o600 });
    console.log('[Security] Generated persistent JWT secret key at .jwt_secret');
  } catch (err) {
    console.warn('[Security] Ephemeral JWT secret generated (in-memory only):', err);
  }
  return generatedSecret;
}

const JWT_SECRET = getJwtSecret();

// --- Password Hashing with scrypt (Memory-Hard) ---
// Format: scrypt$N$r$p$saltHex$derivedKeyHex
const SCRYPT_CONFIG = {
  cost: 16384, // N
  blockSize: 8, // r
  parallelization: 1, // p
  keyLen: 64
};

export function hashPassword(plainText: string): string {
  if (!plainText || typeof plainText !== 'string') {
    throw new Error('Kata sandi harus berupa teks valid.');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(plainText, salt, SCRYPT_CONFIG.keyLen, {
    N: SCRYPT_CONFIG.cost,
    r: SCRYPT_CONFIG.blockSize,
    p: SCRYPT_CONFIG.parallelization
  });
  return `scrypt$${SCRYPT_CONFIG.cost}$${SCRYPT_CONFIG.blockSize}$${SCRYPT_CONFIG.parallelization}$${salt}$${derivedKey.toString('hex')}`;
}

export function isHashedPassword(password: string): boolean {
  return typeof password === 'string' && password.startsWith('scrypt$');
}

export interface PasswordVerificationResult {
  valid: boolean;
  needsRehash: boolean;
}

export function verifyPassword(plainText: string, storedHashOrPlain: string): PasswordVerificationResult {
  if (!plainText || !storedHashOrPlain) {
    return { valid: false, needsRehash: false };
  }

  if (isHashedPassword(storedHashOrPlain)) {
    try {
      const parts = storedHashOrPlain.split('$');
      if (parts.length !== 6) return { valid: false, needsRehash: false };
      const [, nStr, rStr, pStr, salt, hashHex] = parts;
      const N = parseInt(nStr, 10);
      const r = parseInt(rStr, 10);
      const p = parseInt(pStr, 10);

      const computedKey = crypto.scryptSync(plainText, salt, Buffer.from(hashHex, 'hex').length, { N, r, p });
      const storedKey = Buffer.from(hashHex, 'hex');

      if (computedKey.length !== storedKey.length) {
        return { valid: false, needsRehash: false };
      }

      const isValid = crypto.timingSafeEqual(computedKey, storedKey);
      return { valid: isValid, needsRehash: false };
    } catch (err) {
      console.error('[Security] Error during scrypt verification:', err);
      return { valid: false, needsRehash: false };
    }
  }

  // Backward compatibility for existing plaintext passwords in MySQL
  // Uses timing-safe string comparison to prevent timing side-channel attacks
  const plainBuf = Buffer.from(plainText);
  const storedBuf = Buffer.from(storedHashOrPlain);
  const isValid = plainBuf.length === storedBuf.length && crypto.timingSafeEqual(plainBuf, storedBuf);

  return {
    valid: isValid,
    needsRehash: isValid // If matched plaintext, immediately flag for auto-upgrade to scrypt
  };
}

// --- JWT Implementation (HS256 with timing-safe verification) ---
function base64UrlEncode(strOrBuffer: string | Buffer): string {
  const buf = typeof strOrBuffer === 'string' ? Buffer.from(strOrBuffer, 'utf-8') : strOrBuffer;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  role: string;
  fullName: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

export function signToken(payload: JwtPayload, expiresInSeconds = 24 * 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto.createHmac('sha256', JWT_SECRET).update(dataToSign).digest();
  const encodedSignature = base64UrlEncode(signature);

  return `${dataToSign}.${encodedSignature}`;
}

export function verifyToken(token: string): { valid: boolean; payload?: JwtPayload; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token tidak disediakan.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Format token tidak valid.' };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const header = JSON.parse(base64UrlDecode(encodedHeader));
    // CRITICAL SECURITY RULE: Reject 'none' algorithm or anything other than HS256
    if (header.alg !== 'HS256') {
      return { valid: false, error: 'Algoritma token tidak diizinkan.' };
    }

    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(dataToSign).digest();
    const actualSig = Buffer.from(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

    if (expectedSig.length !== actualSig.length || !crypto.timingSafeEqual(expectedSig, actualSig)) {
      return { valid: false, error: 'Tanda tangan token tidak valid.' };
    }

    const payload: JwtPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    // Validate expiration
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Sesi token telah kadaluarsa. Silakan login kembali.' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: 'Gagal memverifikasi token: ' + (err.message || 'Token rusak') };
  }
}

// --- Brute-Force Rate Limiter ---
interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil: number;
}

const loginAttempts = new Map<string, RateLimitRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export function checkLoginRateLimit(key: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS, retryAfterSeconds: 0 };
  }

  // Check if currently locked
  if (record.blockedUntil > now) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: retryAfter };
  }

  // Check if window has expired
  if (now - record.firstAttemptAt > WINDOW_MS) {
    loginAttempts.delete(key);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS, retryAfterSeconds: 0 };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts);
  return { allowed: remaining > 0, remainingAttempts: remaining, retryAfterSeconds: 0 };
}

export function recordFailedLogin(key: string): { remainingAttempts: number; isLocked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  let record = loginAttempts.get(key);

  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    record = { attempts: 1, firstAttemptAt: now, blockedUntil: 0 };
  } else {
    record.attempts += 1;
  }

  if (record.attempts >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    loginAttempts.set(key, record);
    return { remainingAttempts: 0, isLocked: true, retryAfterSeconds: Math.ceil(BLOCK_DURATION_MS / 1000) };
  }

  loginAttempts.set(key, record);
  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - record.attempts);
  return { remainingAttempts: remaining, isLocked: false, retryAfterSeconds: 0 };
}

export function clearLoginRateLimit(key: string): void {
  loginAttempts.delete(key);
}
