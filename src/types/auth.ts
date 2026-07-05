export type City = 'dc' | 'dc2026' | 'atlanta' | 'houston' | 'charlotte';

export type UserRole = 'master' | 'team' | 'superadmin';

export interface User {
  role: UserRole;
  hasAccess: boolean;
  selectedCity?: City;
}

export function hasMasterAccess(role?: UserRole): boolean {
  return role === 'master' || role === 'superadmin';
}

export function isSuperAdmin(role?: UserRole): boolean {
  return role === 'superadmin';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}