import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Boxes,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const ForgotPasswordPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { resetPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Step: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);

  // Form State
  const [email, setEmail] = useState('manager@stockflow.io');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Timers and UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(120); // 2 minutes expiry
  const [resendCooldown, setResendCooldown] = useState(30); // 30s cooldown

  const otpInputsRef = useRef([]);

  // Countdown timer for OTP expiry
  useEffect(() => {
    let interval = null;
    if (step === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  // Countdown for Resend button cooldown
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendCooldown]);

  // Generate a realistic 6-digit OTP
  const generateNewOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setTimerSeconds(120);
    setResendCooldown(30);
    setOtpDigits(['', '', '', '', '', '']);
    return code;
  };

  // ── STEP 1: Submit Email & Send OTP ─────────────────────────────
  const handleSendOtp = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid work email address.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const code = generateNewOtp();
      setIsLoading(false);
      setStep(2);
      toast.success(
        'OTP Sent Successfully',
        `Demo 6-digit verification code generated for ${email}.`
      );
    }, 400);
  };

  // ── STEP 2: Handle OTP Input & Verify ────────────────────────────
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setError('');

    // Auto-focus next input
    if (cleanVal && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setOtpDigits(newDigits);
      const nextIdx = Math.min(5, pasted.length);
      otpInputsRef.current[nextIdx]?.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('');

    if (timerSeconds <= 0) {
      setError('Verification code has expired. Please click Resend Code.');
      return;
    }

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (enteredOtp !== generatedOtp) {
      setError(`Invalid verification code. Please check the demo code (${generatedOtp}).`);
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
      toast.info('OTP Verified', 'Verification code confirmed. Set your new password.');
    }, 300);
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    const code = generateNewOtp();
    toast.info('New Code Sent', `A new demo verification code (${code}) has been generated.`);
  };

  // ── STEP 3: Reset & Confirm Password ────────────────────────────
  const handleResetPassword = (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      resetPassword(email, newPassword);
      setStep(4);
      toast.success('Password Updated', 'Your credentials have been securely reset.');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-200">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-blue-500/15 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Theme toggle */}
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
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-xl shadow-blue-500/25 mb-4">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Stock<span className="text-blue-600">Flow</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Account Security & Password Recovery
          </p>
        </div>

        {/* Form Card Container */}
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-2xl shadow-slate-900/5 rounded-3xl border border-slate-200/90 dark:border-slate-800 relative">
          {/* Progress step indicators */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            {[
              { num: 1, label: 'Email' },
              { num: 2, label: 'Verify OTP' },
              { num: 3, label: 'New Password' },
              { num: 4, label: 'Done' }
            ].map(s => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              return (
                <div key={s.num} className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isActive
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-400'}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: ENTER EMAIL */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Reset your password
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Enter the email address registered with your StockFlow account to receive a 6-digit verification code.
                  </p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4 pt-2">
                  <Input
                    label="Registered Work Email"
                    type="email"
                    icon={Mail}
                    placeholder="e.g. manager@stockflow.io"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    required
                  />

                  {error && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    className="w-full font-bold"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Send Verification Code
                  </Button>
                </form>
              </motion.div>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Enter Verification Code
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    We've simulated sending a 6-digit code to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>.
                  </p>
                </div>

                {/* Simulated OTP Display Banner */}
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 space-y-1 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Demo Simulated OTP Code:</span>
                  </div>
                  <div className="font-mono text-2xl font-extrabold tracking-widest text-blue-600 dark:text-blue-400 select-all">
                    {generatedOtp}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const digits = generatedOtp.split('');
                      setOtpDigits(digits);
                      setError('');
                    }}
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer pt-0.5"
                  >
                    Click to Auto-fill Code
                  </button>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* 6 Digit Input Boxes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 text-center">
                      Enter 6-Digit Code
                    </label>
                    <div className="flex items-center justify-between gap-2" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputsRef.current[idx] = el)}
                          type="text"
                          maxLength={1}
                          inputMode="numeric"
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-11 h-12 text-center text-lg font-bold font-mono bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Timer & Resend */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Expires in:{' '}
                        <strong className="font-mono text-slate-700 dark:text-slate-300">
                          {Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, '0')}
                        </strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleResendOtp}
                      className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                        resendCooldown > 0
                          ? 'text-slate-400 cursor-not-allowed'
                          : 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                      }`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Code'}
                    </button>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    className="w-full font-bold"
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Verify & Continue
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Change Email Address</span>
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 3: NEW PASSWORD */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Create New Password
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Your OTP was verified. Create a secure new password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    required
                  />

                  <Input
                    label="Confirm New Password"
                    type={showPassword ? 'text' : 'password'}
                    icon={Lock}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError('');
                    }}
                    required
                  />

                  {error && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={isLoading}
                    className="w-full font-bold"
                    icon={KeyRound}
                  >
                    Update Password
                  </Button>
                </form>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 text-center py-2"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Password Reset Complete!
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Your password has been successfully updated. You can now sign in with your new credentials.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold"
                  onClick={() => navigate('/login')}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Return to Login
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Back to Login Link */}
          {step !== 4 && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              Remember your credentials?{' '}
              <Link
                to="/login"
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
