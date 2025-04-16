import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
// Use destructuring for version 3 compatibility
import jwt_decode from 'jwt-decode';

const API_URL = 'http://localhost:8000/api';

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  };
  
  // Refresh the token
  const refreshAccessToken = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
        refresh: refreshToken
      });
      
      const { access } = response.data;
      localStorage.setItem('token', access);
      setToken(access);
      return access;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      return null;
    }
  };

  // Create an axios instance that will handle token refresh
  const authAxios = axios.create({
    baseURL: API_URL,
  });
  
  // Add interceptor to check token before each request
  authAxios.interceptors.request.use(
    async (config) => {
      // Check if token is expired and refresh if needed
      if (token && isTokenExpired(token) && refreshToken) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`;
        }
      } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  useEffect(() => {
    if (token) {
      // If token is expired, try to refresh it
      if (isTokenExpired(token) && refreshToken) {
        refreshAccessToken()
          .then(newToken => {
            if (newToken) {
              getUserProfile(newToken);
            } else {
              setLoading(false);
            }
          });
      } else {
        getUserProfile();
      }
    } else {
      setLoading(false);
    }
  }, [token]);

  const getUserProfile = async (currentToken = token) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users/me/`, {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_URL}/auth/token/`, {
        username,
        password
      });
      
      const { access, refresh } = response.data;
      localStorage.setItem('token', access);
      localStorage.setItem('refreshToken', refresh);
      setToken(access);
      setRefreshToken(refresh);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Invalid credentials');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      await axios.post(`${API_URL}/users/`, userData);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    token,
    loading,
    error,
    login,
    logout,
    register,
    authAxios,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 