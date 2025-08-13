// src/services/auth.js
import { loginUser } from './api';

export const authenticate = async (mobile, password) => {
  try {
    const result = await loginUser(mobile, password);
    if (result.Status === 'Success') {
      // Store user data in localStorage
      localStorage.setItem('userData', JSON.stringify(result.MasterData));
      localStorage.setItem('token', result.MasterData.UId);
      return result.MasterData;
    }
    return null;
  } catch (error) {
    console.error('Authentication failed', error);
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('userData');
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const getCurrentUser = () => {
  const userData = localStorage.getItem('userData');
  return userData ? JSON.parse(userData) : null;
};