// components/Login.tsx - CCTV Mascot Login & Register (MKN Brand)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  X,
  Mail,
  BadgeCheck,
  Shield,
  Check,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { testConnection, authApi } from '../services/api';
import { CCTVMascot } from './CCTVMascot';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // Determine if we are on login or register based on URL
  const isLoginMode = location.pathname !== '/register';

  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Register-specific state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [rememberMe, setRememberMe] = useState(false);

  // Particles initialization state
  const [initParticles, setInitParticles] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine: Engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInitParticles(true);
    });
  }, []);


  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password Strength
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Mascot states
  const [isChecking, setIsChecking] = useState(false);
  const [numLook, setNumLook] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
  const [mascotStatus, setMascotStatus] = useState<'idle' | 'success' | 'fail'>('idle');

  // Clear states when switching modes
  useEffect(() => {
    setError(null);
    setSuccess(null);
    setMascotStatus('idle');
    setIsChecking(false);
    setIsClosed(false);
    setNumLook(0);
  }, [isLoginMode]);

  // Load remembered username on mount
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedUsername');
    if (remembered) {
      setUsername(remembered);
      setRememberMe(true);
    }
  }, []);

  // Check password strength
  useEffect(() => {
    if (!isLoginMode) {
      setPasswordStrength({
        hasMinLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      });
    }
  }, [password, isLoginMode]);

  // Clear messages when user starts typing
  useEffect(() => {
    if (username || password || email || fullName) {
      setError(null);
      setSuccess(null);
    }
  }, [username, password, email, fullName]);

  // Sync password visibility with mascot eye state
  useEffect(() => {
    const activeId = document.activeElement?.id;
    if (activeId === 'password' || activeId === 'confirm-password') {
      setIsClosed(true);
      setIsChecking(false);
    }
  }, [showPassword, showConfirmPassword, password]);

  // Mascot focus handlers
  const handleTextFocus = () => {
    setIsChecking(true);
    setIsClosed(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleTextBlur = () => {
    setIsChecking(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const val = e.target.value;
    setter(val);
    const length = Math.min(val.length, 30);
    const lookValue = (length / 30) * 100;
    setNumLook(lookValue);
  };

  const handlePasswordFocus = () => {
    setIsChecking(false);
    setIsClosed(true);
  };

  const handleConfirmPasswordFocus = () => {
    setIsChecking(false);
    setIsClosed(true);
  };

  const handlePasswordBlur = () => {
    setIsClosed(false);
  };

  const validateRegister = () => {
    if (!username.trim() || username.length < 2) {
      setError("Username minimal 2 karakter");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Format email tidak valid");
      return false;
    }
    if (!fullName.trim()) {
      setError("Nama lengkap harus diisi");
      return false;
    }
    const isPasswordValid = Object.values(passwordStrength).every((val) => val);
    if (!isPasswordValid) {
      setError("Password belum memenuhi semua kriteria keamanan");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return false;
    }
    return true;
  };

  const handleLoginSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Harap lengkapi username dan password');
      setMascotStatus('fail');
      setTimeout(() => setMascotStatus('idle'), 1500);
      return;
    }

    setIsLoading(true);

    try {
      const connectionTest = await testConnection();
      if (!connectionTest.success) {
        throw new Error(connectionTest.message);
      }

      await login({ username: username.trim(), password: password.trim() });

      // Handle Remember Me
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username.trim());
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      setSuccess('Login berhasil! Mengarahkan ke dashboard...');
      setMascotStatus('success');
      setUsername('');
      setPassword('');

      const locationState = location.state as { from?: { pathname: string } };
      const from = locationState?.from?.pathname || '/';

      setTimeout(() => { navigate(from, { replace: true }); }, 1500);
    } catch (error: any) {
      handleAuthError(error, 'Login gagal. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!validateRegister()) {
      setMascotStatus('fail');
      setTimeout(() => setMascotStatus('idle'), 1500);
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register({
        username: username.trim(),
        email: email.trim(),
        fullName: fullName.trim(),
        password: password,
        employeeId: employeeId.trim() || undefined,
      });

      setSuccess("Registrasi berhasil! Akun Anda menunggu aktivasi dari Admin.");
      setMascotStatus('success');

      // Clear form
      setUsername("");
      setEmail("");
      setFullName("");
      setEmployeeId("");
      setPassword("");
      setConfirmPassword("");

      // Redirect to login after 3 seconds
      setTimeout(() => { navigate("/"); }, 3000);
    } catch (error: any) {
      handleAuthError(error, 'Gagal melakukan registrasi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthError = (error: any, defaultMessage: string) => {
    console.error('🔐 Auth error details:', error);
    let errorMessage = defaultMessage;
    if (error.message?.includes('Tidak dapat terhubung')) {
      errorMessage = error.message;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    setError(errorMessage);
    setMascotStatus('fail');
    setTimeout(() => setMascotStatus('idle'), 1500);
    triggerShake();
  };

  const triggerShake = () => {
    const form = document.getElementById(isLoginMode ? 'login-form' : 'register-form');
    if (form) {
      form.classList.add('animate-shake');
      setTimeout(() => form.classList.remove('animate-shake'), 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (isLoginMode) {
      handleLoginSubmit();
    } else {
      handleRegisterSubmit();
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const getPasswordStrengthColor = () => {
    const validCount = Object.values(passwordStrength).filter((val) => val).length;
    if (validCount === 0) return "bg-gray-300";
    if (validCount <= 2) return "bg-red-500";
    if (validCount <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    const validCount = Object.values(passwordStrength).filter((val) => val).length;
    if (validCount === 0) return "";
    if (validCount <= 2) return "Weak";
    if (validCount <= 4) return "Medium";
    return "Strong";
  };

  const inputClasses = "block w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-[10px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]/20 focus:border-[#2B6CB0] transition-all shadow-sm";
  const labelClasses = "text-xs font-semibold text-slate-700 ml-1 mb-1 block";
  const iconClasses = "h-5 w-5 text-slate-400";

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 py-12 overflow-x-hidden relative font-sans">
      {/* Photographic Background with Slow Zoom */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[#0f172a]">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[-5%] bg-cover bg-center bg-no-repeat opacity-90"
          style={{ backgroundImage: "url('/bgweb.png')" }}
        />
        {/* Interactive Radio Network Particles */}
        {initParticles && (
          <Particles
            id="tsparticles"
            options={{
              fullScreen: { enable: false, zIndex: 0 },
              fpsLimit: 60,
              interactivity: {
                events: {
                  onHover: { enable: true, mode: "grab" },
                },
                modes: {
                  grab: { distance: 150, links: { opacity: 0.5 } },
                },
              },
              particles: {
                color: { value: ["#2B6CB0", "#D94F2B", "#ffffff"] },
                links: {
                  color: "#2B6CB0",
                  distance: 120,
                  enable: true,
                  opacity: 0.3,
                  width: 1,
                },
                move: {
                  direction: "none",
                  enable: true,
                  outModes: { default: "bounce" },
                  random: false,
                  speed: 0.8,
                  straight: false,
                },
                number: {
                  density: { enable: true, width: 800, height: 800 },
                  value: 60,
                },
                opacity: { value: 0.5 },
                shape: { type: "circle" },
                size: { value: { min: 1, max: 3 } },
              },
              detectRetina: true,
            }}
            className="absolute inset-0 z-0 pointer-events-auto"
          />
        )}
        {/* Dark gradient overlay to ensure the login card stands out and the image blends nicely */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/50 to-[#1B3A6B]/40 pointer-events-none" />
      </div>

      <div className={`w-full ${isLoginMode ? 'max-w-xl' : 'max-w-2xl'} z-10 relative my-8 transition-all duration-500`}>

        {/* Main Card */}
        <motion.div
          layout
          className="bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] p-6 sm:p-10 relative z-10 border border-white/20 pt-0"
        >
          {/* CCTV Mascot Container */}
          <motion.div layout className="flex justify-center -mt-20 sm:-mt-24 mb-6 relative z-20">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-[#F7F8FA] rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.15)] border-[6px] border-white overflow-hidden relative flex items-center justify-center">
              <CCTVMascot
                isChecking={isChecking}
                numLook={numLook}
                isClosed={isClosed}
                status={mascotStatus}
              />
            </div>
          </motion.div>

          <motion.div layout className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {isLoginMode ? (
                <>Selamat <span className="text-[#D94F2B]">Datang</span></>
              ) : (
                'Buat Akun'
              )}
            </h1>
            <p className="text-sm text-slate-500">
              {isLoginMode ? (
                <>
                  Silakan masuk untuk melanjutkan<br />ke dashboard PM MKN
                </>
              ) : (
                'Daftarkan diri Anda untuk mengakses sistem'
              )}
            </p>
          </motion.div>

          {/* Messages */}
          <motion.div layout>
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
                    <div className="flex-1">
                      <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                    <button onClick={clearMessages} className="text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-[10px]"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 p-1.5 rounded-lg flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-green-700 text-sm font-medium">{success}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div layout className="relative">
            <AnimatePresence mode="wait" initial={false}>
              {isLoginMode ? (
                <motion.form
                  key="login"
                  id="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="username" className={labelClasses}>Username *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className={iconClasses} />
                      </div>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => handleTextChange(e, setUsername)}
                        onFocus={handleTextFocus}
                        onBlur={handleTextBlur}
                        className={inputClasses}
                        placeholder="Masukkan username"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className={labelClasses}>Password *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className={iconClasses} />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={handlePasswordFocus}
                        onBlur={handlePasswordBlur}
                        className={inputClasses}
                        placeholder="Masukkan password"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        tabIndex={-1}
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 pb-4 px-2">
                    <div
                      className="flex items-center cursor-pointer group"
                      onClick={() => setRememberMe(!rememberMe)}
                    >
                      <div className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 ease-in-out ${rememberMe ? 'bg-[#2B6CB0]' : 'bg-slate-300'}`}>
                        <motion.div
                          className="bg-white w-4 h-4 rounded-full shadow-sm"
                          layout
                          transition={{ type: "spring", stiffness: 700, damping: 30 }}
                          animate={{ x: rememberMe ? 16 : 0 }}
                        />
                      </div>
                      <label className="ml-2.5 block text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors cursor-pointer select-none">
                        Ingat saya
                      </label>
                    </div>
                    <Link to="/forgot-password" className="text-sm font-medium text-[#2B6CB0] hover:text-[#1B3A6B] transition-colors">
                      Lupa password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-[10px] text-sm font-bold text-white bg-[#D94F2B] hover:bg-[#c24626] transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Memproses...
                      </span>
                    ) : (
                      <>Masuk</>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  id="register-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClasses}>Username *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className={iconClasses} />
                        </div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => handleTextChange(e, setUsername)}
                          onFocus={handleTextFocus}
                          onBlur={handleTextBlur}
                          className={inputClasses}
                          placeholder="Buat username"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClasses}>Email *</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail className={iconClasses} />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => handleTextChange(e, setEmail)}
                          onFocus={handleTextFocus}
                          onBlur={handleTextBlur}
                          className={inputClasses}
                          placeholder="Masukkan email"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Nama Lengkap *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className={iconClasses} />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => handleTextChange(e, setFullName)}
                        onFocus={handleTextFocus}
                        onBlur={handleTextBlur}
                        className={inputClasses}
                        placeholder="Masukkan nama lengkap"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>ID Karyawan (NIP) <span className="text-slate-400 font-normal">(opsional)</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <CreditCard className={iconClasses} />
                      </div>
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => handleTextChange(e, setEmployeeId)}
                        onFocus={handleTextFocus}
                        onBlur={handleTextBlur}
                        className={inputClasses}
                        placeholder="Masukkan NIP (jika ada)"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClasses}>Password *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className={iconClasses} />
                      </div>
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={handlePasswordFocus}
                        onBlur={handlePasswordBlur}
                        className={inputClasses}
                        placeholder="Buat password"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-slate-500">Kekuatan Password</span>
                          <span className={`text-xs font-semibold ${getPasswordStrengthText() === "Strong" ? "text-green-500" : getPasswordStrengthText() === "Medium" ? "text-yellow-500" : "text-red-500"}`}>
                            {getPasswordStrengthText()}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(Object.values(passwordStrength).filter(Boolean).length / 5) * 100}%` }}
                            className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                          />
                        </div>
                        <div className="mt-3 space-y-1.5">
                          {[
                            { key: "hasMinLength", text: "Minimal 8 karakter" },
                            { key: "hasUpperCase", text: "Satu huruf besar" },
                            { key: "hasLowerCase", text: "Satu huruf kecil" },
                            { key: "hasNumber", text: "Satu angka" },
                            { key: "hasSpecialChar", text: "Satu karakter spesial" },
                          ].map((req) => (
                            <div key={req.key} className="flex items-center space-x-2">
                              {passwordStrength[req.key as keyof typeof passwordStrength] ? (
                                <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              ) : (
                                <X className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                              )}
                              <span className={`text-[11px] ${passwordStrength[req.key as keyof typeof passwordStrength] ? "text-slate-700" : "text-slate-400"}`}>
                                {req.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <label className={labelClasses}>Konfirmasi Password *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Shield className={iconClasses} />
                      </div>
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={handleConfirmPasswordFocus}
                        onBlur={handlePasswordBlur}
                        className={inputClasses}
                        placeholder="Konfirmasi password"
                        disabled={isLoading}
                        required
                      />
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5 text-slate-400" /> : <Eye className="h-5 w-5 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 mt-8 rounded-[10px] text-sm font-bold text-white bg-[#D94F2B] hover:bg-[#c24626] transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Memproses...
                      </span>
                    ) : (
                      <>Buat Akun</>
                    )}
                  </button>

                  <div className="bg-slate-50 border border-slate-200 rounded-[10px] p-4 flex gap-3 items-start">
                    <Sparkles className="text-[#D94F2B] shrink-0 mt-0.5 h-4 w-4" />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700">Aktivasi Akun Diperlukan</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Akun Anda perlu diaktifkan oleh administrator sebelum dapat digunakan.
                      </p>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Form Switch Footer */}
          <motion.div layout className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-600">
              {isLoginMode ? "Belum punya akun? " : 'Sudah punya akun? '}
              <Link
                to={isLoginMode ? "/register" : "/"}
                className="font-semibold text-[#2B6CB0] hover:text-[#1B3A6B] transition-colors ml-1"
              >
                {isLoginMode ? 'Daftar sekarang' : 'Masuk di sini'}
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div layout className="text-center mt-8 relative z-10">
          <p className="text-xs text-white/60 font-medium">
            &copy; 2025 PM Dashboard MKN
          </p>
          <p className="text-xs text-white/40 mt-1">
            Developed by J.E.P
          </p>
        </motion.div>

      </div>
    </div>
  );
};

export default React.memo(Login);