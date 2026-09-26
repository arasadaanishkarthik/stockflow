import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const DEMO_USERS = {
  manager: {
    id: 'USR-001',
    name: 'Anish',
    fullName: 'Anish K.',
    email: 'manager@stockflow.io',
    roleTitle: 'Inventory Director & Operations Lead',
    userRole: 'manager', // 'manager' | 'staff'
    roleLabel: 'Inventory Manager',
    department: 'Supply Chain Operations',
    location: 'Chicago Hub (HQ)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Jan 2024',
    phone: '+1 (555) 389-2044',
    timezone: 'America/Chicago (CST)',
  },
  staff: {
    id: 'USR-002',
    name: 'Marcus',
    fullName: 'Marcus Vance',
    email: 'staff@stockflow.io',
    roleTitle: 'Warehouse Logistics Specialist',
    userRole: 'staff', // 'manager' | 'staff'
    roleLabel: 'Warehouse Staff',
    department: 'Floor Logistics & Receiving',
    location: 'Chicago Hub - Dock 4',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    joinedDate: 'Mar 2024',
    phone: '+1 (555) 742-9102',
    timezone: 'America/Chicago (CST)',
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('stockflow_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.userRole) {
          parsed.userRole = 'manager';
          parsed.roleLabel = 'Inventory Manager';
        }
        return parsed;
      }
    } catch {
      // Fallback
    }
    return DEMO_USERS.manager;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const auth = localStorage.getItem('stockflow_auth');
      return auth ? JSON.parse(auth) : false;
    } catch {
      return false;
    }
  });

  const login = (email, password, roleChoice) => {
    let targetUser = { ...DEMO_USERS.manager };

    if (roleChoice === 'staff' || (email && email.toLowerCase().includes('staff'))) {
      targetUser = { ...DEMO_USERS.staff };
    }

    if (email) {
      targetUser.email = email;
      const emailName = email.split('@')[0];
      targetUser.name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }

    setUser(targetUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('stockflow_auth', 'true');
      localStorage.setItem('stockflow_user', JSON.stringify(targetUser));
    } catch {
      // ignore
    }
    return targetUser;
  };

  const switchRole = (newRoleKey) => {
    const targetPreset = newRoleKey === 'staff' ? DEMO_USERS.staff : DEMO_USERS.manager;
    const updated = {
      ...user,
      userRole: targetPreset.userRole,
      roleLabel: targetPreset.roleLabel,
      roleTitle: targetPreset.roleTitle,
    };
    setUser(updated);
    try {
      localStorage.setItem('stockflow_user', JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  };

  const signup = (fullName, email, password, roleChoice = 'manager') => {
    const preset = roleChoice === 'staff' ? DEMO_USERS.staff : DEMO_USERS.manager;
    const newUser = {
      ...preset,
      name: fullName.split(' ')[0],
      fullName: fullName,
      email: email,
    };
    setUser(newUser);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('stockflow_auth', 'true');
      localStorage.setItem('stockflow_user', JSON.stringify(newUser));
    } catch {
      // ignore
    }
    return newUser;
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem('stockflow_auth', 'false');
    } catch {
      // ignore
    }
  };

  const updateProfile = (updatedFields) => {
    const updated = { ...user, ...updatedFields };
    if (updated.userRole === 'staff') {
      updated.roleLabel = 'Warehouse Staff';
    } else {
      updated.roleLabel = 'Inventory Manager';
    }
    setUser(updated);
    try {
      localStorage.setItem('stockflow_user', JSON.stringify(updated));
    } catch {
      // ignore
    }
    return updated;
  };

  const resetPassword = (email, newPassword) => {
    if (user && user.email?.toLowerCase() === email?.toLowerCase()) {
      const updated = { ...user, password: newPassword };
      setUser(updated);
      try {
        localStorage.setItem('stockflow_user', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    return true;
  };

  const userRole = user?.userRole || 'manager';
  const isManager = userRole === 'manager';
  const isStaff = userRole === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isManager,
        isStaff,
        isAuthenticated,
        login,
        signup,
        logout,
        switchRole,
        updateProfile,
        resetPassword,
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

