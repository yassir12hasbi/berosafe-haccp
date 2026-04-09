import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { loginRequest, logoutRequest, User } from '../api/auth';
import { getErrorMessage } from '../utils/error';
const getStorageItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

const setStorageItemAsync = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const deleteStorageItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};
// =========================================================================

/**
 * Interface for Auth context value.
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * custom hook for authentication.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to handle session persistence and routing protection.
 */
function useProtectedRoute(user: User | null, loading: boolean) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/');
    }
  }, [user, loading, segments]);
}

/**
 * Authentication context provider.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredSession();
  }, []);

  useProtectedRoute(user, loading);

  const loadStoredSession = async () => {
    try {
      const storedToken = await getStorageItemAsync('user_token');
      const storedUser = await getStorageItemAsync('user_data');
      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load session:', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { access_token, user: userData } = await loginRequest(email, password);
      await setStorageItemAsync('user_token', access_token);
      await setStorageItemAsync('user_data', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logoutRequest();
    } catch (e) {
      console.error('Logout failed:', getErrorMessage(e));
    } finally {
      await deleteStorageItemAsync('user_token');
      await deleteStorageItemAsync('user_data');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
