import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import {
  User,
  Mail,
  Building,
  MapPin,
  Lock,
  LogOut,
  Save,
  ShieldCheck,
  Calendar,
  Phone,
  Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage = () => {
  const { user, updateProfile, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || 'Anish K.',
    email: user?.email || 'anish@stockflow.io',
    role: user?.role || 'Inventory Director & Operations Lead',
    department: user?.department || 'Supply Chain Operations',
    location: user?.location || 'Chicago Hub (HQ)',
    phone: user?.phone || '+1 (555) 389-2044',
    timezone: user?.timezone || 'America/Chicago (CST)'
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      updateProfile(formData);
      setIsSaving(false);
      toast.success('Profile Updated', 'Your profile details have been saved.');
    }, 300);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwords.newPassword || passwords.newPassword !== passwords.confirmPassword) {
      toast.error('Password Mismatch', 'New password and confirmation must match.');
      return;
    }
    toast.success('Security Updated', 'Password updated successfully in mock auth.');
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            User Profile & Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your credentials, operational role permissions, and notification endpoints.
          </p>
        </div>

        <Button
          variant="danger"
          size="sm"
          icon={LogOut}
          onClick={handleLogout}
        >
          Sign Out
        </Button>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative group">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'User'}
            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-500/20"
          />
          <button
            type="button"
            onClick={() => toast.info('Avatar Upload', 'Photo upload simulated.')}
            className="absolute bottom-1 right-1 p-1.5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
            title="Change Avatar"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {formData.fullName}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 self-center sm:self-auto">
              Active Admin
            </span>
          </div>
          <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-semibold">
            {formData.role}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2">
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              {formData.department}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {formData.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Member since Jan 2024
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Edit Profile Form */}
        <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Personal Information
            </h3>
          </div>

          <Input
            label="Full Name"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />

          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Contact Phone"
            type="tel"
            icon={Phone}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label="Primary Work Location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />

          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={isSaving}
            icon={Save}
            className="w-full"
          >
            Save Profile Details
          </Button>
        </form>

        {/* 2. Security & Password Update */}
        <form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Lock className="w-4 h-4 text-purple-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Security & Password
            </h3>
          </div>

          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
          />

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              icon={ShieldCheck}
              className="w-full"
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
