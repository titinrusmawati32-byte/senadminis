import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  firebaseUser: any; // Retained as null for backward compatibility
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isGuru: boolean;
  loading: boolean;
  loginWithUsername: (u: string, p: string) => Promise<UserProfile>;
  loginWithGoogle?: () => Promise<UserProfile>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    return authService.getCurrentLocalSession();
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (uid: string) => {
    try {
      const p = await authService.getUserProfile(uid);
      if (p) setProfile(p);
    } catch (err) {
      console.warn('Error fetching user profile:', err);
    }
  };

  useEffect(() => {
    // Listen to local / gas auth state changes
    const unsubscribe = authService.onAuthState((user) => {
      setProfile(user);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loginWithUsername = async (u: string, p: string) => {
    setLoading(true);
    try {
      const prof = await authService.loginWithUsername(u, p);
      setProfile(prof);
      return prof;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    throw new Error(
      'Login Google menggunakan database Google Sheets dikelola via akun username/password yang didaftarkan oleh Admin Sekolah.'
    );
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (profile?.uid) {
      await fetchProfile(profile.uid);
    }
  };

  const role: UserRole = profile?.role || 'guru';
  const isAdmin = role === 'admin';
  const isGuru = role === 'guru';

  return (
    <AuthContext.Provider
      value={{
        firebaseUser: null,
        profile,
        role,
        isAdmin,
        isGuru,
        loading,
        loginWithUsername,
        loginWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
