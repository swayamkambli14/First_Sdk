import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isLoggedIn, getApiKey, getAppId, saveCredentials, clearCredentials } from './api';

interface AuthCtx {
  apiKey: string;
  appId: string;
  loggedIn: boolean;
  login: (apiKey: string, appId: string) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState(getApiKey);
  const [appId, setAppId] = useState(getAppId);

  const login = (key: string, id: string) => {
    saveCredentials(key, id);
    setApiKey(key);
    setAppId(id);
  };

  const logout = () => {
    clearCredentials();
    setApiKey('');
    setAppId('');
  };

  return (
    <Ctx.Provider value={{ apiKey, appId, loggedIn: !!apiKey && !!appId, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
