import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { ShieldAlert, Home, ArrowLeft, RefreshCw, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AccessDeniedPage = ({ requiredRole = 'Inventory Manager' }) => {
  const { user, userRole, switchRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSwitchRole = () => {
    switchRole('manager');
    toast.success('Role Switched to Manager', 'You now have full access to management features.');
    navigate('/');
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto">
      {/* Icon Badge */}
      <div className="w-20 h-20 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6 ring-8 ring-rose-50/50 dark:ring-rose-950/30 animate-pulse">
        <ShieldAlert className="w-10 h-10" />
      </div>

      {/* Main Title & Subtitle */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-2">
        Access Restricted
      </h1>

      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
        You are currently signed in as <strong className="text-slate-900 dark:text-slate-200">{user?.roleLabel || (userRole === 'staff' ? 'Warehouse Staff' : 'Inventory Manager')}</strong>. 
        This module requires <span className="inline-flex items-center font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs">{requiredRole}</span> privileges.
      </p>

      {/* Role Summary Box */}
      <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 text-left space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="font-medium">Active Account:</span>
          <span className="font-bold text-slate-900 dark:text-slate-200">{user?.fullName || 'User'} ({user?.email})</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium">Assigned Role:</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {userRole === 'staff' ? 'Warehouse Staff (Operations Only)' : 'Inventory Manager'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <Link to="/" className="w-full sm:w-auto">
          <Button variant="outline" size="md" icon={Home} className="w-full">
            Return to Dashboard
          </Button>
        </Link>

        {userRole === 'staff' && (
          <Button
            variant="primary"
            size="md"
            icon={UserCheck}
            onClick={handleSwitchRole}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            Switch to Demo Manager
          </Button>
        )}
      </div>
    </div>
  );
};
