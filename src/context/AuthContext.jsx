import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, getCurrentUser, logoutUser } from '../api/auth';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const normalizeUser = (data) => {
    // Normalisasi semua kemungkinan struktur response
    const raw = data?.data || data;
    return raw?.user || raw;
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token && token !== 'undefined' && token !== 'null') {
        try {
          client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const { data } = await getCurrentUser();
          setUser(normalizeUser(data));
        } catch (error) {
          console.error("Session expired or invalid token", error);
          logout();
        }
      } else {
        localStorage.removeItem('token');
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await loginUser({ email, password });

      let newToken = null;

      if (response.token) {
        newToken = response.token;
      } else if (response.data && response.data.token) {
        newToken = response.data.token;
      } else if (response.data && typeof response.data === 'string') {
        newToken = response.data;
      }

      if (!newToken) {
        console.error("Token tidak ditemukan di response backend!");
        return { success: false, message: "Token tidak ditemukan dalam respon server." };
      }

      localStorage.setItem('token', newToken);
      setToken(newToken);
      client.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      try {
        const userResponse = await getCurrentUser();
        setUser(normalizeUser(userResponse.data));
      } catch (userError) {
        console.warn("Gagal mengambil data user profil, tapi login dianggap sukses.", userError);
      }

      return { success: true };
    } catch (error) {
      console.error("Login Error:", error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login gagal. Cek koneksi atau kredensial.'
      };
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // Ignore error on logout
    }
    localStorage.removeItem('token');
    delete client.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);