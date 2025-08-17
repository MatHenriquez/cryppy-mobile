import { authenticateWithBiometrics, getBiometricCapabilities } from '@/services/biometricAuth';
import { getUserPreferences, initDatabase, loginUser, registerUser } from '@/services/database';
import { getSecureItem, setSecureItem } from '@/services/secureStore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type User = {
  id: number;
  username: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  tryBiometricLogin: () => Promise<boolean>;
  isLoading: boolean;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        initDatabase();
      } catch (error) {
        console.error('Error inicializando la app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const result = await loginUser(username, password);
      const userData = { id: result.userId, username: result.username, email: result.email };
      setUser(userData);
      
      await setSecureItem('lastUser', JSON.stringify(userData));
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const result = await registerUser(username, email, password);
      if (result.success) {
        const userData = { id: result.userId, username, email };
        setUser(userData);
        
        await setSecureItem('lastUser', JSON.stringify(userData));
      }
    } catch (error) {
      throw error;
    }
  };

  const tryBiometricLogin = async (): Promise<boolean> => {
    try {
      const lastUserData = await getSecureItem('lastUser');
      if (!lastUserData) {
        return false;
      }

      const userData = JSON.parse(lastUserData);
      
      const preferences = getUserPreferences(userData.id);
      if (!preferences?.biometric_enabled) {
        return false;
      }

      const capabilities = await getBiometricCapabilities();
      if (!capabilities.isAvailable) {
        return false;
      }

      const authSuccess = await authenticateWithBiometrics();
      if (authSuccess) {
        setUser(userData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during biometric login:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      tryBiometricLogin,
      isLoading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
