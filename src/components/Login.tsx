// components/Login.tsx - COMPLETE MODERN UPDATE
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  Sparkles,
  Zap,
  Radio,
  Activity,
  X,
} from 'lucide-react';
import { testConnection } from '../services/api';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear messages when user starts typing
  useEffect(() => {
    if (username || password) {
      setError(null);
      setSuccess(null);
    }
  }, [username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!username.trim() || !password.trim()) {
      setError('Harap lengkapi username dan password');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Attempting login...', {
        username: username.trim(),
        baseURL: import.meta.env.VITE_API_URL,
        mode: import.meta.env.MODE,
      });

      // Test connection first
      const connectionTest = await testConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.message);
      }

      await login({
        username: username.trim(),
        password: password.trim(),
      });

      setSuccess('Login berhasil! Mengarahkan ke dashboard...');
      setUsername('');
      setPassword('');

      // Read intended destination from location state or default to dashboard
      const locationState = location.state as { from?: { pathname: string } };
      const from = locationState?.from?.pathname || '/dashboard';

      // Redirect to intended destination
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500);
    } catch (error: any) {
      console.error('🔐 Login error details:', error);

      let errorMessage = 'Username atau password tidak valid';

      if (error.message.includes('Tidak dapat terhubung')) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);

      // Shake animation for error feedback
      const form = document.getElementById('login-form');
      if (form) {
        form.classList.add('animate-shake');
        setTimeout(() => form.classList.remove('animate-shake'), 500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  // Floating icons data
  const floatingIcons = [
    { icon: Radio, color: 'text-blue-400', delay: 0 },
    { icon: Activity, color: 'text-purple-400', delay: 1 },
    { icon: Zap, color: 'text-pink-400', delay: 2 },
    { icon: Sparkles, color: 'text-yellow-400', delay: 1.5 },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 4 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-3xl"
        />

        {/* Floating Icons */}
        {floatingIcons.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 10, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: 6 + index,
                repeat: Infinity,
                delay: item.delay,
              }}
              className={`absolute ${item.color}`}
              style={{
                left: `${20 + index * 20}%`,
                top: `${10 + index * 15}%`,
              }}
            >
              <Icon className="w-12 h-12" />
            </motion.div>
          );
        })}

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          {/* Login Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 relative overflow-hidden"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

            {/* Header */}
            <motion.div variants={itemVariants} className="text-center mb-8">
              {/* Logo */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center justify-center mb-4"
              >
                <div className="relative">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
                  {/* Icon Container */}
                  <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 p-5 rounded-2xl shadow-2xl border border-white/30">
                    <BarChart3 className="w-10 h-10 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                variants={itemVariants}
                className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent"
              >
                Welcome Back
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={itemVariants}
                className="text-blue-100/70 text-sm font-light"
              >
                Sign in to access your analytics dashboard
              </motion.p>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-6 p-4 bg-red-500/20 border border-red-400/50 rounded-xl backdrop-blur-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-red-500/30 p-1.5 rounded-lg flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-red-100 text-sm font-medium">{error}</p>
                    </div>
                    <button
                      onClick={clearMessages}
                      className="text-red-300 hover:text-red-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-6 p-4 bg-green-500/20 border border-green-400/50 rounded-xl backdrop-blur-lg"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-500/30 p-1.5 rounded-lg flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-green-100 text-sm font-medium">{success}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <motion.form
              id="login-form"
              variants={itemVariants}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Username Field */}
              <div className="group">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-blue-100 mb-2 group-focus-within:text-blue-300 transition-colors"
                >
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-300/60 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20"
                    placeholder="Enter your username"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-blue-100 group-focus-within:text-blue-300 transition-colors"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-blue-200/70 hover:text-blue-100 text-xs transition-colors font-medium"
                    disabled={isLoading}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-300/60 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20"
                    placeholder="Enter your password"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-200/70 hover:text-blue-100 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl relative overflow-hidden group"
              >
                {/* Shimmer Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                {/* Button Content */}
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3 relative z-10" />
                    <span className="relative z-10">Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-3 relative z-10" />
                    <span className="relative z-10">Sign In</span>
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* Footer */}
            <motion.div
              variants={itemVariants}
              className="mt-8 pt-6 border-t border-white/10"
            >
              {/* Register Link */}
              <div className="text-center mb-4">
                <p className="text-blue-100/70 text-sm">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="text-blue-300 hover:text-blue-200 font-medium transition-colors"
                  >
                    Create Account
                  </Link>
                </p>
              </div>

              <p className="text-blue-100/40 text-xs text-center font-light">
                © 2024 Call Analytics Dashboard. All rights reserved.
              </p>
              <p className="text-blue-100/30 text-xs text-center font-light mt-1">
                Developed by Jupri Eka Pratama
              </p>
            </motion.div>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            variants={itemVariants}
            className="mt-6 text-center"
          >
            <p className="text-blue-200/50 text-sm">
              Need help? Contact your administrator
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default React.memo(Login);