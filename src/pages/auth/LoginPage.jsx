import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Boxes, Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useToast } from '../../context/ToastContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('anish@stockflow.io');
  const [password, setPassword] = useState('admin1234');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      login(email, password);
      toast.success('Welcome Back, Anish!', 'Logged into StockFlow Operations Hub.');
      navigate('/');
    }, 400);
  };

  const handleDemoFillManager = () => {
    setEmail('manager@stockflow.io');
    setPassword('admin1234');
    toast.info('Demo Manager Loaded', 'Logged in as Inventory Manager.');
    login('manager@stockflow.io', 'admin1234', 'manager');
    navigate('/');
  };

  const handleDemoFillStaff = () => {
    setEmail('staff@stockflow.io');
    setPassword('staff1234');
    toast.info('Demo Staff Loaded', 'Logged in as Warehouse Staff.');
    login('staff@stockflow.io', 'staff1234', 'staff');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-blue-500/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Theme toggle top-right */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Brand Logo & Tagline */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/25 mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Stock<span className="text-blue-600">Flow</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Smart Inventory. Seamless Operations.
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mt-8 bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-2xl shadow-slate-900/5 rounded-3xl border border-slate-200/90 dark:border-slate-800 relative"
        >
          {/* Quick Demo Fill Buttons for Hackathon Evaluation */}
          <div className="mb-6 p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-[11px] text-blue-800 dark:text-blue-300">
                <span className="font-bold">Role-Based Demo Access</span>
                <p className="text-[10px] text-blue-600 dark:text-blue-400">Select a role for instant 1-click test access:</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDemoFillManager}
                className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 py-1.5 px-2 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100/50 dark:hover:bg-slate-700 text-center cursor-pointer shadow-2xs transition-colors flex items-center justify-center gap-1"
              >
                <span>👑 Manager</span>
              </button>
              <button
                type="button"
                onClick={handleDemoFillStaff}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 py-1.5 px-2 rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/50 dark:hover:bg-slate-700 text-center cursor-pointer shadow-2xs transition-colors flex items-center justify-center gap-1"
              >
                <span>📦 Staff</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Work Email Address"
              type="email"
              icon={Mail}
              placeholder="anish@stockflow.io"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            {error && (
              <p className="text-xs text-rose-500 font-medium">{error}</p>
            )}

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me for 30 days</span>
              </label>

              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full mt-2 font-bold"
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In to StockFlow
            </Button>
          </form>

          {/* Switch to Signup */}
          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </motion.div>

        {/* Security badge footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>SOC-2 Type II Certified Mock Environment</span>
        </div>
      </div>
    </div>
  );
};
