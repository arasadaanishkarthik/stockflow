import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

const DEFAULT_USER = {
  id: 'USR-001',
  name: 'Anish',
  fullName: 'Anish K.',
  email: 'anish@stockflow.io',
  role: 'Inventory Director & Operations Lead',
  department: 'Supply Chain Operations',
  location: 'Chicago Hub (HQ)',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  joinedDate: 'Jan 2024',
  phone: '+1 (555) 389-2044',
  timezone: 'America/Chicago (CST)',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockflow_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const auth = localStorage.getItem('stockflow_auth');
    return auth ? JSON.parse(auth) : true; // default true for immediate prototype access
  });

  const login = (email, password) => {
    const mockUser = {
      ...DEFAULT_USER,
      email: email || DEFAULT_USER.email,
      name: email ? email.split('@')[0] : DEFAULT_USER.name,
      fullName: email ? email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) : DEFAULT_USER.fullName,
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    localStorage.setItem('stockflow_auth', 'true');
    localStorage.setItem('stockflow_user', JSON.stringify(mockUser));
    return true;
  };

  const signup = (fullName, email, password) => {
    const newUser = {
      ...DEFAULT_USER,
      name: fullName.split(' ')[0],
      fullName: fullName,
      email: email,
    };
    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem('stockflow_auth', 'true');
    localStorage.setItem('stockflow_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('stockflow_auth', 'false');
  };

  const updateProfile = (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    localStorage.setItem('stockflow_user', JSON.stringify(updated));
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
