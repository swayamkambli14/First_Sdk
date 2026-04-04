import React, { createContext, useContext, useState, ReactNode } from 'react';
import { isLoggedIn, getApiKey, getAppId, saveCredentials, clearCredentials } from './api';

interface CompanyProfile {
  company_id: string;
  name: string;
  email: string;
  logo_url?: string;
  plan: string;
}

interface AuthCtx {
  // API key auth (existing)
  apiKey: string;
  appId: string;
  loggedIn: boolean;
  login: (apiKey: string, appId: string) => void;
  logout: () => void;
  // Company auth (new)
  company: CompanyProfile | null;
  companyToken: string | null;
  setCompanyAuth: (company: CompanyProfile, token: string, activeAppId?: string) => void;
  clearCompanyAuth: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState(getApiKey);
  const [appId, setAppId] = useState(getAppId);
  const [company, setCompany] = useState<CompanyProfile | null>(() => {
    try { return JSON.parse(localStorage.getItem('cl_company') ?? 'null'); } catch { return null; }
  });
  const [companyToken, setCompanyToken] = useState<string | null>(
    () => localStorage.getItem('cl_company_token')
  );

  const login = (key: string, id: string) => {
    saveCredentials(key, id);
    setApiKey(key);
    setAppId(id);
  };

  const logout = () => {
    clearCredentials();
    setApiKey('');
    setAppId('');
    clearCompanyAuth();
  };

  const setCompanyAuth = (c: CompanyProfile, token: string, activeAppId?: string) => {
    localStorage.setItem('cl_company', JSON.stringify(c));
    localStorage.setItem('cl_company_token', token);
    if (activeAppId) localStorage.setItem('cl_active_app_id', activeAppId);
    setCompany(c);
    setCompanyToken(token);
  };

  const clearCompanyAuth = () => {
    localStorage.removeItem('cl_company');
    localStorage.removeItem('cl_company_token');
    localStorage.removeItem('cl_active_app_id');
    setCompany(null);
    setCompanyToken(null);
  };

  return (
    <Ctx.Provider value={{
      apiKey, appId,
      loggedIn: (!!apiKey && !!appId) || !!companyToken,
      login, logout,
      company, companyToken,
      setCompanyAuth, clearCompanyAuth,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
