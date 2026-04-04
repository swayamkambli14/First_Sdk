import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => void;
  updateWallet: (walletAddress: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = 'cl_user_id';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (id: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (data) setUser(data as UserProfile);
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem(SESSION_KEY);
    if (savedId) {
      fetchUser(savedId).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, name: string): Promise<string | null> => {
    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) return 'An account with this email already exists.';

    const { data, error } = await supabase
      .from('users')
      .insert({ email, password, name })
      .select()
      .single();

    if (error) return error.message;

    const profile = data as UserProfile;
    localStorage.setItem(SESSION_KEY, profile.id);
    setUser(profile);
    return null;
  };

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !data) return 'Invalid email or password.';

    const profile = data as UserProfile;

    // Update last_active_at
    await supabase
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', profile.id);

    localStorage.setItem(SESSION_KEY, profile.id);
    setUser(profile);
    return null;
  };

  const signOut = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const updateWallet = async (walletAddress: string) => {
    if (!user) return;
    const { data } = await supabase
      .from('users')
      .update({ wallet_address: walletAddress, last_active_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (data) setUser(data as UserProfile);
  };

  const refreshProfile = async () => {
    if (user) await fetchUser(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateWallet, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
