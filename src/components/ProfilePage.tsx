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
import { formatDateTimeIndonesian, convertUTCtoWITA } from "../utils/dateUtils";
import ImageViewerModal from "./common/ImageViewerModal";
import { ProfileHero } from "./profile/ProfileHero";
import { ProfilePersonalDetails } from "./profile/ProfilePersonalDetails";
import { ProfileSecurity } from "./profile/ProfileSecurity";
import { ProfileInsights } from "./profile/ProfileInsights";

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
  const { user: contextUser, logout, refreshUser } = useAuth();
  const [currentUser, setCurrentUser] = useState(contextUser);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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
  // Fetch fresh profile from API on mount to ensure all fields are current
  useEffect(() => {
    const fetchFreshProfile = async () => {
      try {
        const fresh = await authApi.getProfile();
        setCurrentUser(fresh);
        setPhotoError(false);
      } catch (error) {
        console.error("Failed to fetch fresh profile on mount:", error);
      }
    };
    fetchFreshProfile();
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

  const refreshUserData = useCallback(async (silent = false) => {
    if (!contextUser?.userId) return;
    setRefreshing(true);
    try {
      const fresh = await authApi.getProfile();
      setCurrentUser(fresh);
      localStorage.setItem("user", JSON.stringify(fresh));
      setPhotoError(false);
      // Also update the global auth context so other components see fresh data
      await refreshUser();
      if (!silent) {
        setMessage({ type: "success", text: "Data profil diperbarui" });
      }
    } catch (error) {
      if (!silent) {
        setMessage({ type: "error", text: "Gagal memuat profil terbaru" });
      }
    } finally {
      setRefreshing(false);
    }
  }, [contextUser, refreshUser]);

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

  const hasPhoto = !!(currentUser.photoUrl && !photoError);

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
    <div className="bg-[#F7F8FA] dark:bg-slate-900 font-display text-slate-900 dark:text-slate-100 min-h-[calc(100vh-5rem)]">
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

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto space-y-10 mt-6">
          <ProfileHero
            fullName={currentUser.fullName || ""}
            roleName={currentUser.roleName || ""}
            email={currentUser.email || ""}
            employeeId={currentUser.employeeId || ""}
            photoUrl={currentUser.photoUrl}
            getInitials={getInitials}
            hasPhoto={hasPhoto}
            isEditing={isEditing}
            uploadingPhoto={uploadingPhoto}
            onAvatarClick={handleAvatarClick}
            onPreviewClick={() => setPreviewImage(currentUser.photoUrl!)}
            onCancelEdit={() => setIsEditing(false)}
            onStartEdit={() => setIsEditing(true)}
            onSaveProfile={handleSubmit}
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept="image/*"
            className="hidden"
          />
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Forms */}
            <div className="lg:col-span-8 space-y-10">
              <ProfilePersonalDetails
                fullName={formData.fullName}
                email={formData.email}
                division={currentUser.division || ""}
                employeeId={formData.employeeId}
                isEditing={isEditing}
                onFullNameChange={(val) => setFormData({ ...formData, fullName: val })}
                onEmailChange={(val) => setFormData({ ...formData, email: val })}
                onEmployeeIdChange={(val) => setFormData({ ...formData, employeeId: val })}
                onCancelEdit={() => setIsEditing(false)}
              />

              <ProfileSecurity
                isEditing={isEditing}
                isChangingPassword={isChangingPassword}
                setIsChangingPassword={setIsChangingPassword}
                formData={formData}
                setFormData={setFormData}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                passwordValidation={passwordValidation}
                confirmPasswordMatch={confirmPasswordMatch}
                getStrengthText={getStrengthText}
              />
            </div>

            {/* Right Column: Stats & Platform Insight */}
            <div className="lg:col-span-4">
              <ProfileInsights
                createdAt={currentUser.createdAt}
                lastLogin={currentUser.lastLogin}
                profileCompletion={calculateProfileCompletion()}
              />
            </div>
          </form>
        </div>
      </div>
      
      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={!!previewImage}
        imageUrl={previewImage || ""}
        onClose={() => setPreviewImage(null)}
        altText="Foto Profil"
      />
    </div>
  );
}
