export interface User {
  role: 'master' | 'team';
  hasAccess: boolean;
  selectedCity?: 'dc' | 'atlanta';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}