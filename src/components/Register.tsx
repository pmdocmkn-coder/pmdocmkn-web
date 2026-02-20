// components/Register.tsx - NEW FILE
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Shield,
  Check,
  X as XIcon,
  BadgeCheck,
} from "lucide-react";
import { authApi } from "../services/api";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    employeeId: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const navigate = useNavigate();

  // Check password strength
  useEffect(() => {
    const password = formData.password;
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [formData.password]);

  // Clear messages when user types
  useEffect(() => {
    if (Object.values(formData).some((val) => val)) {
      setError(null);
      setSuccess(null);
    }
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username harus diisi");
      return false;
    }

    // ✅ FIX: konsisten dengan pesan error
    if (formData.username.length < 2) {
      setError("Username minimal 2 karakter");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Email harus diisi");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Format email tidak valid");
      return false;
    }

    if (!formData.fullName.trim()) {
      setError("Nama lengkap harus diisi");
      return false;
    }

    if (!formData.password) {
      setError("Password harus diisi");
      return false;
    }

    const isPasswordValid = Object.values(passwordStrength).every((val) => val);
    if (!isPasswordValid) {
      setError("Password belum memenuhi semua kriteria keamanan");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      const form = document.getElementById("register-form");
      if (form) {
        form.classList.add("animate-shake");
        setTimeout(() => form.classList.remove("animate-shake"), 500);
      }
      return;
    }

    setIsLoading(true);

    try {
      await authApi.register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        password: formData.password,
        employeeId: formData.employeeId.trim() || undefined,
      });

      setSuccess(
        "Registrasi berhasil! Akun Anda menunggu aktivasi dari Admin."
      );

      // Clear form
      setFormData({
        username: "",
        email: "",
        fullName: "",
        employeeId: "",
        password: "",
        confirmPassword: "",
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error: any) {
      console.error("Registration error:", error);

      let errorMessage = "Gagal melakukan registrasi. Silakan coba lagi.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);

      const form = document.getElementById("register-form");
      if (form) {
        form.classList.add("animate-shake");
        setTimeout(() => form.classList.remove("animate-shake"), 500);
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

  const getPasswordStrengthColor = () => {
    const validCount = Object.values(passwordStrength).filter(
      (val) => val
    ).length;
    if (validCount === 0) return "bg-gray-300";
    if (validCount <= 2) return "bg-red-500";
    if (validCount <= 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    const validCount = Object.values(passwordStrength).filter(
      (val) => val
    ).length;
    if (validCount === 0) return "";
    if (validCount <= 2) return "Weak";
    if (validCount <= 4) return "Medium";
    return "Strong";
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
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

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-2xl"
        >
          {/* Back to Login Link */}
          <motion.div variants={itemVariants} className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center space-x-2 text-blue-200 hover:text-blue-100 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Login</span>
            </Link>
          </motion.div>

          {/* Register Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8 relative overflow-hidden"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

            {/* Header */}
            <motion.div variants={itemVariants} className="text-center mb-8">
              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center justify-center mb-4"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-purple-600 to-pink-700 p-5 rounded-2xl shadow-2xl border border-white/30">
                    <UserPlus className="w-10 h-10 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h1
                variants={itemVariants}
                className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text text-transparent"
              >
                Create Account
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={itemVariants}
                className="text-blue-100/70 text-sm font-light"
              >
                Register to access the analytics dashboard
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
                      <p className="text-red-100 text-sm font-medium">
                        {error}
                      </p>
                    </div>
                    <button
                      onClick={clearMessages}
                      className="text-red-300 hover:text-red-100 transition-colors"
                    >
                      <XIcon className="w-4 h-4" />
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
                      <p className="text-green-100 text-sm font-medium">
                        {success}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Register Form */}
            <motion.form
              id="register-form"
              variants={itemVariants}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Username & Email Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Username Field */}
                <div className="group">
                  <label className="block text-sm font-medium text-blue-100 mb-2 group-focus-within:text-blue-300 transition-colors">
                    Username *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-blue-300/60 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20"
                      placeholder="Choose username"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="group">
                  <label className="block text-sm font-medium text-blue-100 mb-2 group-focus-within:text-blue-300 transition-colors">
                    Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-blue-300/60 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20"
                      placeholder="Enter your email"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Full Name Field */}
              <div className="group">
                <label className="block text-sm font-medium text-blue-100 mb-2 group-focus-within:text-blue-300 transition-colors">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-blue-300/60 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20"
                    placeholder="Enter your full name"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Employee ID (NIP) Field - Optional */}
              <div className="group">
                <label className="block text-sm font-medium text-blue-100 mb-2 group-focus-within:text-blue-300 transition-colors">
                  ID Karyawan (NIP)
                  <span className="text-blue-300/50 text-xs ml-1">(opsional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <BadgeCheck className="h-5 w-5 text-blue-300/60 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20"
                    placeholder="Masukkan NIP (jika ada)"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-sm font-medium text-blue-100 mb-2 group-focus-within:text-blue-300 transition-colors">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-300/60 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3 bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20"
                    placeholder="Create password"
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

                {/* Password Strength Indicator */}
                {formData.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-blue-200/70">
                        Password Strength
                      </span>
                      <span
                        className={`text-xs font-medium ${getPasswordStrengthText() === "Strong"
                            ? "text-green-400"
                            : getPasswordStrengthText() === "Medium"
                              ? "text-yellow-400"
                              : "text-red-400"
                          }`}
                      >
                        {getPasswordStrengthText()}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(Object.values(passwordStrength).filter(
                            (val) => val
                          ).length /
                              5) *
                            100
                            }%`,
                        }}
                        className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                      />
                    </div>

                    {/* Password Requirements */}
                    <div className="mt-3 space-y-2">
                      {[
                        { key: "hasMinLength", text: "At least 8 characters" },
                        { key: "hasUpperCase", text: "One uppercase letter" },
                        { key: "hasLowerCase", text: "One lowercase letter" },
                        { key: "hasNumber", text: "One number" },
                        {
                          key: "hasSpecialChar",
                          text: "One special character",
                        },
                      ].map((req) => (
                        <motion.div
                          key={req.key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center space-x-2"
                        >
                          {passwordStrength[
                            req.key as keyof typeof passwordStrength
                          ] ? (
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          ) : (
                            <XIcon className="w-4 h-4 text-red-400 flex-shrink-0" />
                          )}
                          <span
                            className={`text-xs ${passwordStrength[
                                req.key as keyof typeof passwordStrength
                              ]
                                ? "text-green-300"
                                : "text-blue-200/50"
                              }`}
                          >
                            {req.text}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="group">
                <label className="block text-sm font-medium text-blue-100 mb-2 group-focus-within:text-blue-300 transition-colors">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-blue-300/60 group-focus-within:text-blue-400 transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-11 pr-12 py-3 bg-white/10 border border-white/20 text-white placeholder-blue-200/50 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 backdrop-blur-lg transition-all duration-300 hover:bg-white/15 focus:bg-white/20"
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-200/70 hover:text-blue-100 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 flex items-center space-x-2"
                  >
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-300">
                          Passwords match
                        </span>
                      </>
                    ) : (
                      <>
                        <XIcon className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-300">
                          Passwords do not match
                        </span>
                      </>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-500 hover:via-pink-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3 relative z-10" />
                    <span className="relative z-10">Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-3 relative z-10" />
                    <span className="relative z-10">Create Account</span>
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* Footer */}
            <motion.div variants={itemVariants} className="mt-6 text-center">
              <p className="text-blue-100/70 text-sm">
                Already have an account?{" "}
                <Link
                  to="/"
                  className="text-blue-300 hover:text-blue-200 font-medium transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </motion.div>

            {/* Info Box */}
            <motion.div
              variants={itemVariants}
              className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl backdrop-blur-lg"
            >
              <div className="flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">
                    Account Activation Required
                  </p>
                  <p className="text-blue-200/70 text-xs">
                    Your account will need to be activated by an administrator
                    before you can log in. You'll receive a confirmation once
                    your account is activated.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default React.memo(Register);
