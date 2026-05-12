import React, { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Check,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password strength validation
  const validations = useMemo(() => ({
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
    matches: password.length > 0 && password === confirmPassword,
  }), [password, confirmPassword]);

  const allValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Token reset tidak valid. Silakan minta link baru.');
      return;
    }

    if (!allValid) {
      setError('Pastikan semua syarat password terpenuhi.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        token,
        newPassword: password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Gagal mereset password. Link mungkin sudah kedaluwarsa.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const ValidationItem = ({ valid, label }: { valid: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {valid ? (
        <Check className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-red-400/60" />
      )}
      <span className={`text-xs ${valid ? 'text-green-300' : 'text-blue-200/50'}`}>{label}</span>
    </div>
  );

  // Invalid token state
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center border border-red-400/30">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-red-200 mb-2">Link Tidak Valid</h2>
          <p className="text-blue-100/60 text-sm mb-6">
            Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru.
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all"
          >
            Minta Link Baru
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/30 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <motion.div
            variants={itemVariants}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

            {/* Header */}
            <motion.div variants={itemVariants} className="text-center mb-8">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="inline-flex items-center justify-center mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl shadow-2xl border border-white/30">
                    <ShieldCheck className="w-10 h-10 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-200 via-teal-200 to-cyan-200 bg-clip-text text-transparent"
              >
                Reset Password
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-blue-100/70 text-sm font-light"
              >
                Buat password baru untuk akun Anda
              </motion.p>
            </motion.div>

            {/* Error */}
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
                    <p className="text-red-100 text-sm font-medium flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-300 hover:text-red-100 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success */}
            <AnimatePresence>
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center border border-green-400/30">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-green-200 mb-2">Password Berhasil Direset!</h3>
                  <p className="text-blue-100/60 text-sm mb-2">
                    Password Anda telah diperbarui. Anda akan diarahkan ke halaman login...
                  </p>
                  <div className="w-5 h-5 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
                </motion.div>
              ) : (
                /* Form */
                <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div className="group">
                    <label htmlFor="password" className="block text-sm font-medium text-blue-100 mb-2">
                      Password Baru
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-blue-300/60 group-focus-within:text-blue-400 transition-colors" />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(null); }}
                        className="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20"
                        placeholder="Masukkan password baru"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-200/70 hover:text-blue-100 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Checklist */}
                  {password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1.5"
                    >
                      <ValidationItem valid={validations.minLength} label="Minimal 8 karakter" />
                      <ValidationItem valid={validations.hasUpper} label="Huruf besar (A-Z)" />
                      <ValidationItem valid={validations.hasLower} label="Huruf kecil (a-z)" />
                      <ValidationItem valid={validations.hasDigit} label="Angka (0-9)" />
                      <ValidationItem valid={validations.hasSymbol} label="Simbol (!@#$...)" />
                    </motion.div>
                  )}

                  {/* Confirm Password */}
                  <div className="group">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-100 mb-2">
                      Konfirmasi Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-blue-300/60 group-focus-within:text-blue-400 transition-colors" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                        className="w-full pl-11 pr-12 py-3.5 bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20"
                        placeholder="Ulangi password baru"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-200/70 hover:text-blue-100 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && !validations.matches && (
                      <p className="mt-1.5 text-red-400/80 text-xs">Password tidak cocok</p>
                    )}
                  </div>

                  {/* Submit */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading || !allValid}
                    className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3 relative z-10" />
                        <span className="relative z-10">Memproses...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-5 h-5 mr-3 relative z-10" />
                        <span className="relative z-10">Reset Password</span>
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Footer */}
            {!success && (
              <motion.div variants={itemVariants} className="mt-8 pt-6 border-t border-white/10 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-blue-200/70 hover:text-blue-100 text-sm transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Login
                </Link>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default React.memo(ResetPassword);
