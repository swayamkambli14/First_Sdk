/**
 * Reads the custodial (email/password) session from the API cookie.
 * Returns user info if signed in via email, null otherwise.
 */
import { useState, useEffect } from 'react';
import axios from 'axios';

interface CustodialUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  wallet_mode: string;
  onboarding_complete: boolean;
}

export function useCustodialSession() {
  const [user, setUser] = useState<CustodialUser | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    axios.get('/v1/user-auth/me', { withCredentials: true })
      .then((res) => setUser(res.data as CustodialUser))
      .catch(() => setUser(null));
  }, []);

  const logout = async () => {
    await axios.post('/v1/user-auth/logout', {}, { withCredentials: true }).catch(() => {});
    setUser(null);
    window.location.href = '/';
  };

  return {
    user,
    loading: user === undefined,
    isCustodial: user !== null && user !== undefined,
    logout,
  };
}
