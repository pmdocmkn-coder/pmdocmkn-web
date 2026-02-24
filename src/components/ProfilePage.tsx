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
import { formatDetailDate, convertUTCtoWITA } from "../utils/dateUtils";

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
  // Removed auto-refresh on mount as it is unnecessary

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

  const formatRelativeTime = (dateString: string | null | undefined) => {
    if (!dateString) return "-";

    // Convert UTC to WITA
    const date = convertUTCtoWITA(dateString);
    if (!date) return "-";

    const now = new Date();
    // Get current time in WITA for "Today" comparison
    const nowWita = convertUTCtoWITA(now.toISOString()) || now;

    const isToday = date.getDate() === nowWita.getDate() &&
      date.getMonth() === nowWita.getMonth() &&
      date.getFullYear() === nowWita.getFullYear();

    // Format to 12-hour AM/PM (08:42 AM)
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    const timeString = `${hours12.toString().padStart(2, '0')}:${minutes} ${ampm}`;

    if (isToday) {
      return `Today, ${timeString}`;
    } else {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    }
  };

  // Calculate Profile Completion
  const calculateProfileCompletion = () => {
    let fields = 0;
    let filled = 0;
    const checkField = (val: any) => {
      fields++;
      if (val) filled++;
    };

    checkField(currentUser.fullName);
    checkField(currentUser.email);
    checkField(currentUser.employeeId);
    checkField(currentUser.division);
    checkField(currentUser.photoUrl);

    return Math.round((filled / fields) * 100);
  };

  return (
    <div className="bg-background-light dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-[calc(100vh-5rem)]">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ✅ Modal Konfirmasi Logout */}
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

        {/* Notification Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={`mb-8 p-5 rounded-xl flex items-center gap-4 shadow-sm border ${message.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
                }`}
            >
              <div
                className={`p-2 rounded-full ${message.type === "success" ? "bg-green-100" : "bg-red-100"
                  }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
              <span className="font-medium flex-1 text-sm">{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="p-1 hover:bg-black/10 rounded-full transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 mb-8 shadow-xl">
          <div className="absolute inset-0 opacity-20 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuDqEYSTfD4ZdypubQ46NN0wPrlBdYPP0bDA3xfwNgbPeVXw8akVk72LJuwrzlgHwuCrsx0Ng495GOXxUPNoUD18ROhfAdtPV7EnAE1T6lhIa_0KyM1l67hUmVqgwACSzXAZeneeG85yoBATbXP4xVZzpK2twvRL1nK3PN0AMIE0x8mPd1F2ZYYHXpSrXVfhKNY5XffyZE93_re76Az3S2SydmnKmE1sneYb0byv9-q5c1kb2q-kjKeD9ZWuOvek6KLk722pGsU')]"></div>

          <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              {hasPhoto ? (
                <div className="size-32 rounded-full border-4 border-white/30 shadow-2xl overflow-hidden cursor-pointer relative" onClick={handleAvatarClick}>
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.fullName}
                    onError={() => setPhotoError(true)}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </div>
              ) : (
                <div className="size-32 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-white text-4xl font-bold shadow-2xl cursor-pointer relative overflow-hidden" onClick={handleAvatarClick}>
                  {getInitials()}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-green-500 size-6 rounded-full border-4 border-blue-600"></div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h2 className="text-3xl font-extrabold text-white">{currentUser.fullName}</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-md border border-white/30">
                  {currentUser.roleName?.toUpperCase() || "USER"}
                </span>
              </div>
              <p className="text-white/80 flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {currentUser.email}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all border border-white/20 font-medium text-sm"
                >
                  <X className="w-4 h-4" />
                  Cancel Edit
                </button>
              )}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all border border-white/20 font-medium text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg transition-all font-bold text-sm"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Main Forms */}
            <div className="lg:col-span-2 space-y-8">

              {/* Personal Information */}
              <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <User className="text-blue-600 w-5 h-5" />
                  <h3 className="font-bold text-lg">Personal Information</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Full Name</label>
                    <input
                      type="text"
                      value={isEditing ? formData.fullName : currentUser.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      disabled={!isEditing}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-slate-50/50 disabled:text-slate-900 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-300 disabled:cursor-default"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Email Address</label>
                    <input
                      type="email"
                      value={isEditing ? formData.email : currentUser.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="w-full mt-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-blue-500 transition-colors disabled:bg-slate-50/50 disabled:text-slate-900 dark:disabled:bg-slate-800/50 dark:disabled:text-slate-300 disabled:cursor-default"
                    />
                  </div>
                </div>
              </section>

              {/* Employee Details */}
              <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <BadgeCheck className="text-blue-600 w-5 h-5" />
                  <h3 className="font-bold text-lg">Employee Details</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Building2 className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Division</p>
                      <p className="font-bold text-slate-900 dark:text-white">{currentUser.division || "Not set"}</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <UserCheck className="text-blue-600 dark:text-blue-400 w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee ID</p>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            className="w-full mt-1 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            placeholder="EMP-..."
                          />
                        ) : (
                          <p className="font-bold text-slate-900 dark:text-white">{currentUser.employeeId || "Not set"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Account Security */}
              <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-800">
                      <Lock className="text-amber-500 w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Account Security</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Manage your password and authentication methods</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setIsChangingPassword(!isChangingPassword);
                    }}
                    className="w-full md:w-auto px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
                  >
                    Change Password
                  </button>
                </div>

                <AnimatePresence>
                  {isChangingPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800"
                    >
                      <div className="space-y-4 pt-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Current Password</label>
                          <div className="relative">
                            <input
                              type={showPassword.old ? "text" : "password"}
                              value={formData.oldPassword}
                              onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                              className="w-full pr-10 pl-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                              required={isChangingPassword}
                            />
                            <button type="button" onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                              {showPassword.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">New Password</label>
                            <div className="relative">
                              <input
                                type={showPassword.new ? "text" : "password"}
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                className={`w-full pr-10 pl-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-900 transition-colors focus:ring-1 ${formData.newPassword ? (passwordValidation.isValid ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : 'border-orange-500 focus:ring-orange-500 focus:border-orange-500') : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500'}`}
                                required={isChangingPassword}
                              />
                              <button type="button" onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                                {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>

                            {formData.newPassword && (
                              <div className="mt-2 space-y-2 text-xs">
                                <div className="flex justify-between font-bold">
                                  <span>Strength: <span className={passwordValidation.strength <= 40 ? 'text-red-500' : passwordValidation.strength <= 80 ? 'text-amber-500' : 'text-green-500'}>{getStrengthText(passwordValidation.strength)}</span></span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-slate-500">
                                  <span className={passwordValidation.requirements.minLength ? 'text-green-500 font-medium' : ''}>8+ chars</span>
                                  <span className={passwordValidation.requirements.upperCase ? 'text-green-500 font-medium' : ''}>Uppercase</span>
                                  <span className={passwordValidation.requirements.lowerCase ? 'text-green-500 font-medium' : ''}>Lowercase</span>
                                  <span className={passwordValidation.requirements.numbers ? 'text-green-500 font-medium' : ''}>Number</span>
                                  <span className={passwordValidation.requirements.specialChar ? 'text-green-500 font-medium' : ''}>Special</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">Confirm Password</label>
                            <div className="relative">
                              <input
                                type={showPassword.confirm ? "text" : "password"}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className={`w-full pr-10 pl-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-900 transition-colors focus:ring-1 ${formData.confirmPassword ? (confirmPasswordMatch ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : 'border-red-500 focus:ring-red-500 focus:border-red-500') : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-500'}`}
                                required={isChangingPassword}
                              />
                              <button type="button" onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors">
                                {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            {formData.confirmPassword && (
                              <p className={`text-xs mt-1 font-medium ${confirmPasswordMatch ? 'text-green-600' : 'text-red-600'}`}>
                                {confirmPasswordMatch ? 'Passwords match' : 'Passwords do not match'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

            </div>

            {/* Right Column: Metadata & Summary */}
            <div className="space-y-8">

              {/* Account Information */}
              <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <UserCheck className="text-blue-600 w-5 h-5" />
                  <h3 className="font-bold text-lg">Account Information</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Registered Since</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {currentUser.createdAt ? (
                        (() => {
                          const date = convertUTCtoWITA(currentUser.createdAt);
                          if (!date) return "-";
                          const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                          return `${date.getDate().toString().padStart(2, '0')} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                        })()
                      ) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Last Login</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formatRelativeTime(currentUser.lastLogin)}
                    </span>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase">Profile Completion</span>
                      <span className="text-xs font-bold text-blue-600">{calculateProfileCompletion()}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${calculateProfileCompletion()}%` }}></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Save Changes */}
              {isEditing && (
                <div className="p-6 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 flex flex-col gap-4 sticky top-24">
                  <p className="text-xs text-center text-slate-500 font-medium">Any changes made will be logged in the system audit trail.</p>
                  <button
                    type="submit"
                    disabled={loading || (isChangingPassword && (!passwordValidation.isValid || !confirmPasswordMatch))}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/30 transition-all font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                  </button>
                </div>
              )}

              {/* Active Privileges Info */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Shield className="text-slate-700 dark:text-slate-300 w-4 h-4" />
                  Active Privileges
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <CheckCircle className="text-green-500 w-4 h-4" />
                    System Access
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <CheckCircle className="text-green-500 w-4 h-4" />
                    Data View Rights
                  </li>
                  {currentUser.roleName?.toLowerCase() === 'super admin' && (
                    <li className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                      <CheckCircle className="text-green-500 w-4 h-4" />
                      Full Admin Privileges
                    </li>
                  )}
                </ul>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

