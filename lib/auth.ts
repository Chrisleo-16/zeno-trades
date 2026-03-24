// Simple authentication store for MVP
// In production, this would connect to Supabase Auth

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

const AUTH_KEY = 'sniper_auth';

export const authStore = {
  getCurrentUser: (): AuthUser | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser: (user: AuthUser) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  },

  logout: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(AUTH_KEY);
  },

  register: (email: string, password: string, name: string) => {
    // MVP: Simple registration (no password validation in this version)
    const user: AuthUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
    };
    authStore.setCurrentUser(user);
    return user;
  },

  login: (email: string, password: string) => {
    // MVP: Simple login (no actual password verification)
    // This would be replaced with Supabase Auth in production
    const user: AuthUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
    };
    authStore.setCurrentUser(user);
    return user;
  },

  isAuthenticated: (): boolean => {
    return authStore.getCurrentUser() !== null;
  },
};
