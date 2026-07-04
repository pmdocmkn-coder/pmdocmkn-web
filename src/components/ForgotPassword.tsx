import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { Engine } from '@tsparticles/engine';
import { api } from '../services/api';
import { CCTVMascot } from './CCTVMascot';

const inputClasses = "w-full pl-11 pr-4 py-3.5 bg-white border border-[#E2E8F0] text-[#1A202C] placeholder:text-[#718096] rounded-[10px] focus:ring-2 focus:ring-[#2B6CB0]/20 focus:border-[#2B6CB0] transition-all outline-none shadow-sm disabled:bg-[#F7F8FA] disabled:cursor-not-allowed";
const labelClasses = "block text-sm font-semibold text-[#1A202C] mb-2";
const iconClasses = "h-5 w-5 text-slate-400";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [initParticles, setInitParticles] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [numLook, setNumLook] = useState(0);
  const [mascotStatus, setMascotStatus] = useState<'idle' | 'success' | 'fail'>('idle');

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInitParticles(true);
    });
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setEmail(nextValue);
    setError(null);
    setNumLook((Math.min(nextValue.length, 30) / 30) * 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Harap masukkan email Anda');
      setMascotStatus('fail');
      setTimeout(() => setMascotStatus('idle'), 1500);
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
      setMascotStatus('success');
    } catch {
      // Security: don't reveal whether the email exists.
      setSuccess(true);
      setMascotStatus('success');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 py-12 overflow-x-hidden relative font-sans">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#0f172a]">
        <motion.div
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-[-5%] bg-cover bg-center bg-no-repeat opacity-90"
          style={{ backgroundImage: "url('/bgweb.png')" }}
        />

        {initParticles && (
          <Particles
            id="forgot-password-particles"
            options={{
              fullScreen: { enable: false },
              fpsLimit: 60,
              interactivity: {
                events: {
                  onHover: { enable: true, mode: 'grab' },
                  resize: { enable: true },
                },
                modes: {
                  grab: { distance: 150, links: { opacity: 0.5 } },
                },
              },
              particles: {
                color: { value: ['#2B6CB0', '#D94F2B', '#ffffff'] },
                links: {
                  color: '#2B6CB0',
                  distance: 120,
                  enable: true,
                  opacity: 0.3,
                  width: 1,
                },
                move: {
                  direction: 'none',
                  enable: true,
                  outModes: { default: 'bounce' },
                  random: false,
                  speed: 0.8,
                  straight: false,
                },
                number: {
                  density: { enable: true, width: 800, height: 800 },
                  value: 60,
                },
                opacity: { value: 0.5 },
                shape: { type: 'circle' },
                size: { value: { min: 1, max: 3 } },
              },
              detectRetina: true,
            }}
            className="absolute inset-0 z-0 pointer-events-auto"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/50 to-[#1B3A6B]/40 pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-xl z-10 relative my-8"
      >
        <div className="bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-6 sm:p-10 relative z-10 border border-white/20 pt-0">
          <motion.div className="flex justify-center -mt-20 sm:-mt-24 mb-6 relative z-20">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-[#F7F8FA] rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.15)] border-[6px] border-white relative flex items-center justify-center">
              <CCTVMascot
                isChecking={isChecking}
                numLook={numLook}
                isClosed={false}
                status={mascotStatus}
                fieldSpan="full"
              />
            </div>
          </motion.div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#1A202C] tracking-tight mb-2">
              Lupa <span className="text-[#D94F2B]">Password?</span>
            </h1>
            <p className="text-sm text-[#718096] leading-relaxed max-w-sm mx-auto">
              Masukkan email akun Anda untuk menerima instruksi reset password dari sistem PM MKN.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[10px]"
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-red-100 p-1.5 rounded-lg flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
                  <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                className="text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 bg-green-50 rounded-[14px] flex items-center justify-center border border-green-200">
                  <CheckCircle2 className="w-7 h-7 text-[#059669]" />
                </div>
                <h3 className="text-lg font-bold text-[#1A202C] mb-2">Link Reset Dikirim</h3>
                <p className="text-sm text-[#718096] mb-7 leading-relaxed">
                  Jika email <span className="text-[#1B3A6B] font-semibold">{email}</span> terdaftar,
                  instruksi reset password sudah dikirim. Periksa inbox atau folder spam Anda.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-[10px] bg-[#1B3A6B] hover:bg-[#2B6CB0] text-white text-sm font-bold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Login
                </Link>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 14 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="flex items-start gap-3 rounded-[10px] border border-[#E2E8F0] bg-[#F7F8FA] px-4 py-3">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#EBF4FF] text-[#2B6CB0]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <p className="text-xs leading-relaxed text-[#718096]">
                    Untuk keamanan akun, kami tidak menampilkan apakah email terdaftar atau tidak.
                    Jika cocok, link reset akan dikirim otomatis.
                  </p>
                </div>

                <div>
                  <label htmlFor="forgot-email" className={labelClasses}>Email *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className={iconClasses} />
                    </div>
                    <input
                      id="forgot-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={handleEmailChange}
                      onFocus={() => setIsChecking(true)}
                      onBlur={() => setIsChecking(false)}
                      className={inputClasses}
                      placeholder="Masukkan email Anda"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-[10px] text-sm font-bold text-white bg-[#D94F2B] hover:bg-[#c24626] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Kirim Link Reset
                    </>
                  )}
                </button>

                <div className="pt-6 border-t border-[#E2E8F0] text-center">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#2B6CB0] hover:text-[#1B3A6B] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Login
                  </Link>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center mt-6 text-xs text-slate-300/80">
          <p className="font-semibold">© 2025 PM Dashboard MKN</p>
          <p className="mt-1">Developed by J.E.P</p>
        </div>
      </motion.div>
    </div>
  );
};

export default React.memo(ForgotPassword);
