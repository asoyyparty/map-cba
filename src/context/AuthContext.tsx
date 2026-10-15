import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AuthUser, UserRole, Permission, ROLE_PERMISSIONS } from '../types/auth';

interface SignInResult {
  success: boolean;
  error?: string;
  retryAfter?: number;
  remainingAttempts?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  permissions: Permission[];
  isLoading: boolean;
  isMysqlConnected: boolean;
  hasPermission: (permission: Permission) => boolean;
  signIn: (identifier: string, password?: string, rememberMe?: boolean) => Promise<SignInResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cba_auth_token';
const USER_KEY = 'cba_auth_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Global fetch interceptor to automatically attach JWT Bearer token
let isInterceptorInstalled = false;
function installFetchInterceptor(onUnauthorized: () => void) {
  if (typeof window === 'undefined' || isInterceptorInstalled) return;
  isInterceptorInstalled = true;

  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let url = '';
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
      url = (input as Request).url;
    }

    // Attach token to /api/ requests except unauthenticated public endpoints
    const isApiRequest = url.startsWith('/api/') || url.includes('/api/');
    const isPublic = url.includes('/api/auth/login') || url.includes('/api/health');

    let modifiedInit = init ? { ...init } : {};

    if (isApiRequest && !isPublic) {
      const token = getStoredToken();
      if (token) {
        const headers = new Headers(modifiedInit.headers || (input instanceof Request ? input.headers : {}));
        if (!headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        modifiedInit.headers = headers;
      }
    }

    try {
      const response = await originalFetch(input, modifiedInit);

      // Handle token expiration or invalid session (401)
      if (response.status === 401 && isApiRequest && !isPublic) {
        console.warn('[AuthInterceptor] 401 Unauthorized received, expiring local session.');
        onUnauthorized();
      }

      return response;
    } catch (fetchErr) {
      throw fetchErr;
    }
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const [isMysqlConnected, setIsMysqlConnected] = useState(true);
  const isMountedRef = useRef(true);

  // Logout handler
  const handleUnauthorized = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    } catch {}
    if (isMountedRef.current) {
      setUser(null);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    installFetchInterceptor(handleUnauthorized);

    const initAuth = async () => {
      const token = getStoredToken();

      try {
        // 1. Verify backend MySQL health
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          setIsMysqlConnected(true);
        } else {
          setIsMysqlConnected(false);
        }

        // 2. Validate token with server /api/auth/me
        if (token) {
          const meRes = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.success && meData.data) {
              const verifiedUser: AuthUser = {
                id: meData.data.id,
                username: meData.data.username,
                email: meData.data.email,
                fullName: meData.data.fullName,
                role: meData.data.role as UserRole,
                permissions: meData.data.permissions || ROLE_PERMISSIONS[meData.data.role as UserRole] || [],
                site: meData.data.site || 'PT. CBA Chemical Industry',
                avatarUrl: meData.data.avatarUrl,
                lastLogin: meData.data.lastLogin
              };
              setUser(verifiedUser);
              // Refresh storage user info
              const isLocal = !!localStorage.getItem(TOKEN_KEY);
              const storage = isLocal ? localStorage : sessionStorage;
              storage.setItem(USER_KEY, JSON.stringify(verifiedUser));
            } else {
              handleUnauthorized();
            }
          } else {
            // Token expired or invalid on server
            handleUnauthorized();
          }
        } else {
          handleUnauthorized();
        }
      } catch (err) {
        console.warn('[AuthContext] Backend connection notice:', err);
        setIsMysqlConnected(false);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const role: UserRole = user?.role || 'VIEWER';
  const permissions: Permission[] = user?.permissions || ROLE_PERMISSIONS[role] || [];

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const signIn = async (
    identifier: string,
    password = '',
    rememberMe = true
  ): Promise<SignInResult> => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ identifier, password, rememberMe })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        return {
          success: false,
          error: resData.message || 'Login gagal. Periksa kembali username dan kata sandi.',
          retryAfter: resData.retryAfter,
          remainingAttempts: resData.remainingAttempts
        };
      }

      const token = resData.token;
      const verifiedUser: AuthUser = {
        id: resData.data.id,
        username: resData.data.username,
        email: resData.data.email,
        fullName: resData.data.fullName,
        role: resData.data.role as UserRole,
        permissions: resData.data.permissions || ROLE_PERMISSIONS[resData.data.role as UserRole] || [],
        site: resData.data.site || 'PT. CBA Chemical Industry',
        avatarUrl: resData.data.avatarUrl,
        lastLogin: resData.data.lastLogin || new Date().toISOString()
      };

      // Store token & user based on rememberMe preference
      const targetStorage = rememberMe ? localStorage : sessionStorage;
      const otherStorage = rememberMe ? sessionStorage : localStorage;

      otherStorage.removeItem(TOKEN_KEY);
      otherStorage.removeItem(USER_KEY);

      targetStorage.setItem(TOKEN_KEY, token);
      targetStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));

      setUser(verifiedUser);
      setIsMysqlConnected(true);

      return { success: true };
    } catch (err: any) {
      console.error('[AuthContext] Sign in error:', err);
      return {
        success: false,
        error: 'Tidak dapat terhubung ke server autentikasi CBA. Pastikan backend aktif.'
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      handleUnauthorized();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      permissions,
      isLoading,
      isMysqlConnected,
      hasPermission,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const usePermission = (permission: Permission): boolean => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};
