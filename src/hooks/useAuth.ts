import { useState, useEffect } from 'react';
import type { AuthState } from '../types/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });

  useEffect(() => {
    // Check for existing session in localStorage
    const savedAuth = localStorage.getItem('ebony-fit-auth');
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setAuthState(parsed);
      } catch (error) {
        console.error('Error parsing saved auth:', error);
        localStorage.removeItem('ebony-fit-auth');
      }
    }
  }, []);

  const login = (role: 'master' | 'team') => {
    const newAuthState: AuthState = {
      isAuthenticated: true,
      user: {
        role,
        hasAccess: true,
        selectedCity: undefined
      }
    };
    
    setAuthState(newAuthState);
    localStorage.setItem('ebony-fit-auth', JSON.stringify(newAuthState));
  };

  const selectCity = (city: 'dc' | 'atlanta') => {
    if (authState.user) {
      const newAuthState: AuthState = {
        ...authState,
        user: {
          ...authState.user,
          selectedCity: city
        }
      };
      
      setAuthState(newAuthState);
      localStorage.setItem('ebony-fit-auth', JSON.stringify(newAuthState));
    }
  };
  const logout = () => {
    const newAuthState: AuthState = {
      isAuthenticated: false,
      user: null
    };
    
    setAuthState(newAuthState);
    localStorage.removeItem('ebony-fit-auth');
  };

  return {
    ...authState,
    login,
    selectCity,
    logout
  };
}