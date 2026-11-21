import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('kolaborin_token'));
  const [extra, setExtra] = useState({ rank: 0, badges: [], ownedOrgs: [], todayCaps: {} });
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/me');
      setUser(res.data.user);
      setExtra({
        rank: res.data.rank,
        badges: res.data.badges || [],
        ownedOrgs: res.data.ownedOrgs || [],
        todayCaps: res.data.todayCaps || {}
      });
    } catch (err) {
      console.error('Failed to load user profile:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = (newToken, newUser) => {
    localStorage.setItem('kolaborin_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('kolaborin_token');
    setToken(null);
    setUser(null);
    setExtra({ rank: 0, badges: [], ownedOrgs: [], todayCaps: {} });
  };

  const refreshProfile = () => {
    if (token) {
      return fetchCurrentUser();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, extra, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
