import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
} from 'lucide-react';
import { api } from '../services/api';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Harap masukkan email Anda');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (err: any) {
      // Always show success to user (security: don't reveal if email exists)
      setSuccess(true);
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
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
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-2xl shadow-2xl border border-white/30">
                    <KeyRound className="w-10 h-10 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-3xl font-bold mb-2 bg-gradient-to-r from-amber-200 via-orange-200 to-yellow-200 bg-clip-text text-transparent"
              >
                Lupa Password?
              </motion.h1>
              <motion.p
                variants={itemVariants}
                className="text-blue-100/70 text-sm font-light"
              >
                Masukkan email Anda dan kami akan mengirimkan link untuk reset password
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
                    <p className="text-red-100 text-sm font-medium flex-1">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-300 hover:text-red-100 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success State */}
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
                  <h3 className="text-lg font-bold text-green-200 mb-2">Email Terkirim!</h3>
                  <p className="text-blue-100/60 text-sm mb-6 leading-relaxed">
                    Jika email <span className="text-blue-200 font-medium">{email}</span> terdaftar, 
                    kami telah mengirimkan link untuk reset password. Periksa inbox atau folder spam Anda.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-blue-300 hover:text-blue-200 text-sm font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Login
                  </Link>
                </motion.div>
              ) : (
                /* Form */
                <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-5">
                  <div className="group">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-blue-100 mb-2 group-focus-within:text-blue-300 transition-colors"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-blue-300/60 group-focus-within:text-blue-400 transition-colors" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(null); }}
                        className="w-full pl-11 pr-4 py-3.5 bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20"
                        placeholder="Masukkan email Anda"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3 relative z-10" />
                        <span className="relative z-10">Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-3 relative z-10" />
                        <span className="relative z-10">Kirim Link Reset</span>
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

export default React.memo(ForgotPassword);
