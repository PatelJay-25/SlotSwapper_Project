import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getToken as storageGetToken, setToken as storageSetToken, logout as storageLogout } from '../lib/auth.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => storageGetToken());
  const [user, setUser] = useState(null);

  function login(nextToken, nextUser) {
    storageSetToken(nextToken);
    setUser(nextUser || null);
    setToken(nextToken);
  }

  function logout() {
    storageLogout();
    setUser(null);
    setToken(null);
  }

  // Sync across tabs
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'slotswapper_token') {
        setToken(e.newValue);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ token, user, login, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


