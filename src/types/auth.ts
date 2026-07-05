export type City = 'dc' | 'dc2026' | 'atlanta' | 'houston' | 'charlotte';

export interface User {
  role: 'master' | 'team';
  hasAccess: boolean;
  selectedCity?: City;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}