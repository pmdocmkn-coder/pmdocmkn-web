// components/ProfilePage.tsx - VERSION PREMIUM & MODERN WITH PASSWORD VALIDATION & MODAL
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authApi } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Camera,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit3,
  Key,
  LogOut,
  Upload,
  UserCheck,
  Check,
  X as XIcon,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { formatDateTimeIndonesian, formatDetailDate } from "../utils/dateUtils";

// Password validation utility functions
const validatePassword = (password: string) => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid:
      hasMinLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar,
    requirements: {
      minLength: hasMinLength,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      numbers: hasNumbers,
      specialChar: hasSpecialChar,
    },
    strength: calculatePasswordStrength(password),
  };
};

const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/\d/.test(password)) strength += 20;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;
  return strength;
};

const getStrengthColor = (strength: number) => {
  if (strength <= 40) return "bg-red-500";
  if (strength <= 60) return "bg-orange-500";
  if (strength <= 80) return "bg-yellow-500";
  return "bg-green-500";
};

const getStrengthText = (strength: number) => {
  if (strength <= 40) return "Lemah";
  if (strength <= 60) return "Cukup";
  if (strength <= 80) return "Baik";
  return "Sangat Kuat";
};

export default function ProfilePage() {
  const { user: contextUser, logout } = useAuth();
  const [currentUser, setCurrentUser] = useState(contextUser);
  const [photoError, setPhotoError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ✅ TAMBAHAN: State untuk modal konfirmasi logout
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    employeeId: "",
    division: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    requirements: {
      minLength: false,
      upperCase: false,
      lowerCase: false,
      numbers: false,
      specialChar: false,
    },
    strength: 0,
  });

  const [confirmPasswordMatch, setConfirmPasswordMatch] = useState<
    boolean | null
  >(null);

  // Auto-hide message dengan animasi
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Real-time password validation
  useEffect(() => {
    if (formData.newPassword) {
      const validation = validatePassword(formData.newPassword);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation({
        isValid: false,
        requirements: {
          minLength: false,
          upperCase: false,
          lowerCase: false,
          numbers: false,
          specialChar: false,
        },
        strength: 0,
      });
    }
  }, [formData.newPassword]);

  // Real-time confirm password validation
  useEffect(() => {
    if (formData.confirmPassword) {
      setConfirmPasswordMatch(
        formData.newPassword === formData.confirmPassword
      );
    } else {
      setConfirmPasswordMatch(null);
    }
  }, [formData.newPassword, formData.confirmPassword]);

  // Load & sync user data
  useEffect(() => {
    if (contextUser) refreshUserData();
  }, []);

  useEffect(() => {
    if (contextUser) setCurrentUser(contextUser);
  }, [contextUser]);

  useEffect(() => {
    if (!isEditing && currentUser) {
      setFormData({
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
        employeeId: currentUser.employeeId || "",
        division: currentUser.division || "",
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
      setShowPassword({ old: false, new: false, confirm: false });
      setPasswordValidation({
        isValid: false,
        requirements: {
          minLength: false,
          upperCase: false,
          lowerCase: false,
          numbers: false,
          specialChar: false,
        },
        strength: 0,
      });
      setConfirmPasswordMatch(null);
    }
  }, [isEditing, currentUser]);

  // Multi-tab sync
  useEffect(() => {
    const handler = () => {
      const u = localStorage.getItem("user");
      if (u) {
        try {
          setCurrentUser(JSON.parse(u));
          setPhotoError(false);
        } catch (error) {
          console.error("Error syncing user data:", error);
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!contextUser?.userId) return;
    setRefreshing(true);
    try {
      const fresh = await authApi.getProfile();
      setCurrentUser(fresh);
      localStorage.setItem("user", JSON.stringify(fresh));
      setPhotoError(false);
      setMessage({ type: "success", text: "Data profil diperbarui" });
    } catch (error) {
      setMessage({ type: "error", text: "Gagal memuat profil terbaru" });
    } finally {
      setRefreshing(false);
    }
  }, [contextUser]);

  const getInitials = () => {
    if (!currentUser?.fullName) return "U";
    const names = currentUser.fullName.trim().split(" ");
    return names.length >= 2
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.userId) return;

    if (!file.type.startsWith("image/")) {
      return setMessage({
        type: "error",
        text: "Hanya file gambar yang diperbolehkan",
      });
    }
    if (file.size > 5 * 1024 * 1024) {
      return setMessage({ type: "error", text: "Ukuran file maksimal 5MB" });
    }

    setUploadingPhoto(true);
    try {
      await authApi.uploadProfilePhoto(currentUser.userId, file);
      await refreshUserData();
      setMessage({
        type: "success",
        text: "Foto profil berhasil diperbarui! 🎉",
      });
    } catch (error) {
      setMessage({ type: "error", text: "Gagal mengupload foto profil" });
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    if (!currentUser?.userId || !currentUser.photoUrl) return;

    if (!confirm("Apakah Anda yakin ingin menghapus foto profil?")) return;

    setUploadingPhoto(true);
    try {
      await authApi.deleteProfilePhoto(currentUser.userId);
      await refreshUserData();
      setMessage({ type: "success", text: "Foto profil berhasil dihapus" });
    } catch (error) {
      setMessage({ type: "error", text: "Gagal menghapus foto profil" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.userId) return;

    setLoading(true);
    setMessage(null);

    try {
      let hasChanges = false;
      let passwordChanged = false;

      // Update profile information
      if (
        formData.fullName !== currentUser.fullName ||
        formData.email !== currentUser.email ||
        formData.employeeId !== (currentUser.employeeId || "")
      ) {
        await authApi.updateProfile(currentUser.userId, {
          fullName: formData.fullName,
          email: formData.email,
          employeeId: formData.employeeId || undefined,
        });
        hasChanges = true;
      }

      // Change password if requested
      if (isChangingPassword && formData.newPassword) {
        if (!passwordValidation.isValid) {
          throw new Error(
            "Password baru tidak memenuhi semua persyaratan keamanan"
          );
        }
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("Konfirmasi password tidak cocok");
        }

        if (formData.oldPassword === formData.newPassword) {
          throw new Error("Password baru harus berbeda dengan password lama");
        }

        await authApi.changePassword(
          formData.oldPassword,
          formData.newPassword
        );
        hasChanges = true;
        passwordChanged = true;
      }

      if (!hasChanges) {
        setMessage({
          type: "error",
          text: "Tidak ada perubahan yang dilakukan",
        });
        setLoading(false);
        return;
      }

      await refreshUserData();

      if (passwordChanged) {
        // ✅ SOLUSI 3: Tampilkan modal konfirmasi logout
        setShowLogoutModal(true);

        // Reset form
        setIsEditing(false);
        setIsChangingPassword(false);
        setFormData({
          fullName: currentUser.fullName || "",
          email: currentUser.email || "",
          employeeId: currentUser.employeeId || "",
          division: currentUser.division || "",
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({ type: "success", text: "Profil berhasil diperbarui! ✅" });
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error("❌ Error update profile:", error);

      // Handle error yang lebih spesifik
      let errorMessage =
        error.message || "Terjadi kesalahan saat menyimpan perubahan";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      // Handle specific error cases
      if (
        errorMessage.includes("current password") ||
        errorMessage.includes("password lama") ||
        errorMessage.includes("Invalid current password")
      ) {
        errorMessage =
          "❌ Password lama yang Anda masukkan salah. Silakan coba lagi.";
      } else if (
        errorMessage.includes("strength") ||
        errorMessage.includes("persyaratan")
      ) {
        errorMessage = "❌ Password baru tidak memenuhi persyaratan keamanan.";
      }

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin logout?")) {
      await logout();
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Memuat profil...</p>
        </div>
      </div>
    );
  }

  const hasPhoto = currentUser.photoUrl && !photoError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* ✅ TAMBAHAN: Modal Konfirmasi Logout */}
        <AnimatePresence>
          {showLogoutModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowLogoutModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Password Berhasil Diubah!
                  </h3>

                  <p className="text-gray-600 mb-6">
                    Untuk keamanan akun Anda, kami menyarankan untuk login
                    kembali dengan password baru.
                  </p>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowLogoutModal(false);
                        setMessage({
                          type: "success",
                          text: "✅ Password berhasil diubah! Anda bisa logout manual kapan saja.",
                        });
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Lanjutkan
                    </button>

                    <button
                      onClick={() => {
                        setShowLogoutModal(false);
                        logout();
                      }}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout Sekarang
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header dengan animasi */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Profil Saya
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Kelola informasi profil dan keamanan akun Anda dengan mudah
          </p>
        </motion.div>

        {/* Notification Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`mb-8 p-5 rounded-2xl flex items-center gap-4 shadow-lg border-l-4 ${message.type === "success"
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-l-green-500"
                : "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-l-red-500"
                }`}
            >
              <div
                className={`p-2 rounded-full ${message.type === "success" ? "bg-green-100" : "bg-red-100"
                  }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <span className="font-medium flex-1">{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="p-1 hover:bg-black/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden mb-8"
        >
          {/* Gradient Header Section */}
          <div className="relative h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 overflow-hidden">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

            {/* Animated background elements */}
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative px-6 sm:px-8 pb-8">
            {/* Profile Avatar Section */}
            <div className="absolute -top-20 left-6 sm:left-8 group">
              <div className="relative">
                {hasPhoto ? (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <img
                      key={currentUser.photoUrl}
                      src={currentUser.photoUrl}
                      alt={currentUser.fullName}
                      onError={() => setPhotoError(true)}
                      onClick={handleAvatarClick}
                      className="w-40 h-40 rounded-full object-cover border-8 border-white shadow-2xl cursor-pointer transition-all duration-300"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    onClick={handleAvatarClick}
                    className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold border-8 border-white shadow-2xl cursor-pointer transition-all duration-300"
                  >
                    {getInitials()}
                  </motion.div>
                )}

                {/* Upload/Delete Buttons - Always visible on mobile, hover on desktop */}
                <div className="absolute -bottom-2 -right-2 sm:bottom-2 sm:right-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAvatarClick();
                    }}
                    disabled={uploadingPhoto}
                    className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    title="Ganti Foto Profil"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                  </motion.button>

                  {currentUser.photoUrl && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto();
                      }}
                      disabled={uploadingPhoto}
                      className="bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                      title="Hapus Foto Profil"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  )}
                </div>

                {/* Online Status Indicator */}
                <div className="absolute bottom-3 right-3 w-5 h-5 bg-green-500 border-4 border-white rounded-full shadow-lg" />
              </div>
            </div>

            {/* User Info Section */}
            <div className="pt-24 md:pt-20 md:ml-52">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                {/* Info User */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {currentUser.fullName}
                      </h2>
                      <div className="flex items-center gap-3 text-gray-600 justify-center lg:justify-start">
                        <Mail className="w-5 h-5" />
                        <span className="text-lg">{currentUser.email}</span>
                      </div>
                    </div>

                    <div className="flex justify-center lg:justify-start">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full shadow-lg">
                        <Shield className="w-4 h-4" />
                        <span className="font-semibold">
                          {currentUser.roleName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={refreshUserData}
                    disabled={refreshing}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-medium text-gray-700 disabled:opacity-50 order-2 sm:order-1"
                  >
                    {refreshing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-5 h-5" />
                    )}
                    Refresh Data
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 order-1 sm:order-2"
                  >
                    <Edit3 className="w-5 h-5" />
                    {isEditing ? "Batal Edit" : "Edit Profil"}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLogout}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2 order-3"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </motion.button>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Edit Form Section */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="px-6 sm:px-8 pb-8 border-t border-gray-100 overflow-hidden"
              >
                <form onSubmit={handleSubmit} className="space-y-8 pt-8">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fullName: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          placeholder="Masukkan nama lengkap"
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          placeholder="nama@email.com"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Employee Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Employee ID */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        ID Karyawan (NIP)
                      </label>
                      <div className="relative">
                        <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.employeeId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              employeeId: e.target.value,
                            })
                          }
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                          placeholder="Contoh: EMP-2026-001"
                        />
                      </div>
                    </div>

                    {/* Division - Read Only (diatur oleh Admin) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Divisi
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.division || "Belum ditentukan"}
                          readOnly
                          disabled
                          className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-gray-400 italic">
                        Divisi ditentukan oleh Admin melalui User Management
                      </p>
                    </div>
                  </div>

                  {/* Password Change Section */}
                  <motion.div
                    className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Key className="w-5 h-5 text-blue-600" />
                        </div>
                        Keamanan Akun
                      </h3>
                      <button
                        type="button"
                        onClick={() =>
                          setIsChangingPassword(!isChangingPassword)
                        }
                        className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Lock className="w-4 h-4" />
                        {isChangingPassword
                          ? "Batal Ganti Password"
                          : "Ganti Password"}
                      </button>
                    </div>

                    <p className="text-gray-600 text-sm mb-6">
                      Pastikan password Anda kuat dan unik untuk keamanan akun
                    </p>

                    <AnimatePresence>
                      {isChangingPassword && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-5"
                        >
                          {/* Current Password */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                              Password Saat Ini
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type={showPassword.old ? "text" : "password"}
                                value={formData.oldPassword}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    oldPassword: e.target.value,
                                  })
                                }
                                className="w-full pl-12 pr-14 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                                placeholder="Masukkan password saat ini"
                                required
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPassword({
                                    ...showPassword,
                                    old: !showPassword.old,
                                  })
                                }
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                {showPassword.old ? (
                                  <EyeOff className="w-5 h-5" />
                                ) : (
                                  <Eye className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* New Password */}
                            <div className="space-y-3">
                              <label className="block text-sm font-medium text-gray-700">
                                Password Baru
                              </label>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type={showPassword.new ? "text" : "password"}
                                  value={formData.newPassword}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      newPassword: e.target.value,
                                    })
                                  }
                                  className={`w-full pl-12 pr-14 py-3.5 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-white ${formData.newPassword
                                    ? passwordValidation.isValid
                                      ? "border-green-500 focus:ring-green-500"
                                      : "border-orange-500 focus:ring-orange-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                    }`}
                                  placeholder="Minimal 8 karakter"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPassword({
                                      ...showPassword,
                                      new: !showPassword.new,
                                    })
                                  }
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  {showPassword.new ? (
                                    <EyeOff className="w-5 h-5" />
                                  ) : (
                                    <Eye className="w-5 h-5" />
                                  )}
                                </button>
                              </div>

                              {/* Password Strength Indicator */}
                              {formData.newPassword && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="space-y-3"
                                >
                                  {/* Strength Bar */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="font-medium">
                                        Kekuatan Password:
                                      </span>
                                      <span
                                        className={`font-bold ${passwordValidation.strength <= 40
                                          ? "text-red-600"
                                          : passwordValidation.strength <= 60
                                            ? "text-orange-600"
                                            : passwordValidation.strength <= 80
                                              ? "text-yellow-600"
                                              : "text-green-600"
                                          }`}
                                      >
                                        {getStrengthText(
                                          passwordValidation.strength
                                        )}
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full transition-all duration-500 ${getStrengthColor(
                                          passwordValidation.strength
                                        )}`}
                                        style={{
                                          width: `${passwordValidation.strength}%`,
                                        }}
                                      />
                                    </div>
                                  </div>

                                  {/* Requirements List */}
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                      Persyaratan:
                                    </p>
                                    <div className="grid grid-cols-1 gap-2 text-sm">
                                      <div
                                        className={`flex items-center gap-2 ${passwordValidation.requirements
                                          .minLength
                                          ? "text-green-600"
                                          : "text-red-600"
                                          }`}
                                      >
                                        {passwordValidation.requirements
                                          .minLength ? (
                                          <Check className="w-4 h-4" />
                                        ) : (
                                          <XIcon className="w-4 h-4" />
                                        )}
                                        <span>Minimal 8 karakter</span>
                                      </div>
                                      <div
                                        className={`flex items-center gap-2 ${passwordValidation.requirements
                                          .upperCase
                                          ? "text-green-600"
                                          : "text-red-600"
                                          }`}
                                      >
                                        {passwordValidation.requirements
                                          .upperCase ? (
                                          <Check className="w-4 h-4" />
                                        ) : (
                                          <XIcon className="w-4 h-4" />
                                        )}
                                        <span>Huruf besar (A-Z)</span>
                                      </div>
                                      <div
                                        className={`flex items-center gap-2 ${passwordValidation.requirements
                                          .lowerCase
                                          ? "text-green-600"
                                          : "text-red-600"
                                          }`}
                                      >
                                        {passwordValidation.requirements
                                          .lowerCase ? (
                                          <Check className="w-4 h-4" />
                                        ) : (
                                          <XIcon className="w-4 h-4" />
                                        )}
                                        <span>Huruf kecil (a-z)</span>
                                      </div>
                                      <div
                                        className={`flex items-center gap-2 ${passwordValidation.requirements
                                          .numbers
                                          ? "text-green-600"
                                          : "text-red-600"
                                          }`}
                                      >
                                        {passwordValidation.requirements
                                          .numbers ? (
                                          <Check className="w-4 h-4" />
                                        ) : (
                                          <XIcon className="w-4 h-4" />
                                        )}
                                        <span>Angka (0-9)</span>
                                      </div>
                                      <div
                                        className={`flex items-center gap-2 ${passwordValidation.requirements
                                          .specialChar
                                          ? "text-green-600"
                                          : "text-red-600"
                                          }`}
                                      >
                                        {passwordValidation.requirements
                                          .specialChar ? (
                                          <Check className="w-4 h-4" />
                                        ) : (
                                          <XIcon className="w-4 h-4" />
                                        )}
                                        <span>Simbol (!@#$% dll)</span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Konfirmasi Password Baru
                              </label>
                              <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                  type={
                                    showPassword.confirm ? "text" : "password"
                                  }
                                  value={formData.confirmPassword}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      confirmPassword: e.target.value,
                                    })
                                  }
                                  className={`w-full pl-12 pr-14 py-3.5 border rounded-xl focus:ring-2 focus:border-transparent transition-all duration-200 bg-white ${formData.confirmPassword
                                    ? confirmPasswordMatch
                                      ? "border-green-500 focus:ring-green-500"
                                      : "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                    }`}
                                  placeholder="Ketik ulang password baru"
                                  required
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPassword({
                                      ...showPassword,
                                      confirm: !showPassword.confirm,
                                    })
                                  }
                                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                  {showPassword.confirm ? (
                                    <EyeOff className="w-5 h-5" />
                                  ) : (
                                    <Eye className="w-5 h-5" />
                                  )}
                                </button>
                              </div>

                              {/* Confirm Password Match Indicator */}
                              {formData.confirmPassword && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className={`flex items-center gap-2 text-sm ${confirmPasswordMatch
                                    ? "text-green-600"
                                    : "text-red-600"
                                    }`}
                                >
                                  {confirmPasswordMatch ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <XIcon className="w-4 h-4" />
                                  )}
                                  <span>
                                    {confirmPasswordMatch
                                      ? "Password cocok"
                                      : "Password tidak cocok"}
                                  </span>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={
                        loading ||
                        (isChangingPassword &&
                          (!passwordValidation.isValid ||
                            !confirmPasswordMatch))
                      }
                      className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 font-bold text-lg flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                    >
                      {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Save className="w-6 h-6" />
                      )}
                      Simpan Perubahan
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Employee Details Section */}
          <div className="px-6 sm:px-8 pb-6 border-t border-gray-100 pt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <BadgeCheck className="w-6 h-6 text-blue-600" />
              Detail Karyawan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Divisi
                    </p>
                    <p className="text-gray-900 font-bold text-lg">
                      {currentUser.division || "Belum diisi"}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-6 border border-slate-200"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <BadgeCheck className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      ID Karyawan (NIP)
                    </p>
                    <p className="text-gray-900 font-bold text-lg">
                      {currentUser.employeeId || "Belum diisi"}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="px-6 sm:px-8 pb-8 border-t border-gray-100 pt-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-blue-600" />
              Informasi Akun
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-blue-600 text-sm font-semibold">
                      Terdaftar Sejak
                    </p>
                    <p className="text-gray-900 font-bold text-lg">
                      {formatDetailDate(currentUser.createdAt)}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-purple-600 text-sm font-semibold">
                      Login Terakhir
                    </p>
                    <p className="text-gray-900 font-bold text-lg">
                      {currentUser.lastLogin
                        ? formatDateTimeIndonesian(currentUser.lastLogin)
                        : "Belum pernah login"}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
