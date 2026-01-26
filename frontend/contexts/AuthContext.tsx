import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles?: string[];
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const mapApiUserToUser = (apiUser: any): User => {
    const fullName = (apiUser?.full_name || '').trim();
    const nameParts = fullName ? fullName.split(/\s+/) : [];
    const firstName = apiUser?.firstName ?? (nameParts[0] || '');
    const lastName = apiUser?.lastName ?? (nameParts.slice(1).join(' ') || '');

    return {
      id: apiUser?.id,
      email: apiUser?.email || '',
      firstName,
      lastName,
      roles: Array.isArray(apiUser?.roles) ? apiUser.roles : [],
      phone: apiUser?.phone,
      address: apiUser?.address,
      createdAt: apiUser?.createdAt || apiUser?.created_at || new Date().toISOString(),
    };
  };

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('botai_user');
    const savedSession = localStorage.getItem('botai_session');

    if (savedUser && savedSession) {
      try {
        const user = JSON.parse(savedUser);
        const session = JSON.parse(savedSession);

        // Check if session is still valid
        const now = new Date().getTime();
        const sessionExpiry = new Date(session.expiresAt).getTime();

        if (now < sessionExpiry) {
          const mappedUser = mapApiUserToUser(user);
          setUser(mappedUser);

          const token = localStorage.getItem('auth_token');
          if (token && mappedUser?.id) {
            apiClient.getUserProfile(mappedUser.id)
              .then((response) => {
                if (response.success && response.data) {
                  const refreshedUser = mapApiUserToUser(response.data);
                  setUser(refreshedUser);
                  localStorage.setItem('botai_user', JSON.stringify(refreshedUser));
                }
              })
              .catch(() => {
              });
          }
        } else {
          // Session expired, clear data
          localStorage.removeItem('botai_user');
          localStorage.removeItem('botai_session');
        }
      } catch (error) {
        localStorage.removeItem('botai_user');
        localStorage.removeItem('botai_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await apiClient.login(email, password);

      if (response.success && response.data) {
        const { user, access_token, expiresAt } = response.data as any;
        const token = access_token; // Backend returns access_token

        // Store JWT token
        localStorage.setItem('auth_token', token);

        // Set session duration based on remember me
        const sessionDuration = rememberMe
          ? 30 * 24 * 60 * 60 * 1000 // 30 days
          : 24 * 60 * 60 * 1000; // 24 hours

        const localSession = {
          token,
          expiresAt: new Date(Date.now() + sessionDuration).toISOString(),
          rememberMe,
          createdAt: new Date().toISOString()
        };

        const mappedUser = mapApiUserToUser(user);
        setUser(mappedUser);
        localStorage.setItem('botai_user', JSON.stringify(mappedUser));
        localStorage.setItem('botai_session', JSON.stringify(localSession));

        setIsLoading(false);
        return true;
      }

      setAuthError(response.error || 'Login failed. Please try again.');
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('Unable to connect to server. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await apiClient.register(userData);

      if (response.success && response.data) {
        const { user, access_token, expiresAt } = response.data as any;
        const token = access_token; // Backend returns access_token

        // Store JWT token
        localStorage.setItem('auth_token', token);

        // Auto-login after successful registration
        const session = {
          token,
          expiresAt,
          rememberMe: false,
          createdAt: new Date().toISOString()
        };

        const mappedUser = mapApiUserToUser(user);
        setUser(mappedUser);
        localStorage.setItem('botai_user', JSON.stringify(mappedUser));
        localStorage.setItem('botai_session', JSON.stringify(session));

        setIsLoading(false);
        return true;
      }

      setAuthError(response.error || 'Registration failed. Please try again.');
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError('Unable to connect to server. Please try again.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setAuthError(null);
    localStorage.removeItem('botai_user');
    localStorage.removeItem('botai_session');
    localStorage.removeItem('auth_token');
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const payload: { email?: string; full_name?: string } = {};

      if (typeof userData.email === 'string') {
        payload.email = userData.email;
      }

      if (typeof userData.firstName === 'string' || typeof userData.lastName === 'string') {
        const nextFirstName = typeof userData.firstName === 'string' ? userData.firstName : user.firstName;
        const nextLastName = typeof userData.lastName === 'string' ? userData.lastName : user.lastName;
        payload.full_name = `${nextFirstName || ''} ${nextLastName || ''}`.trim();
      }

      let persistedUser = user;
      if (Object.keys(payload).length > 0) {
        const response = await apiClient.updateMyProfile(payload);
        if (!response.success || !response.data) {
          setIsLoading(false);
          return false;
        }

        persistedUser = mapApiUserToUser(response.data);
      }

      const updatedUser = { ...persistedUser, ...userData };
      setUser(updatedUser);
      localStorage.setItem('botai_user', JSON.stringify(updatedUser));
      setIsLoading(false);
      return true;
    } catch (error) {
      setIsLoading(false);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    authError,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

