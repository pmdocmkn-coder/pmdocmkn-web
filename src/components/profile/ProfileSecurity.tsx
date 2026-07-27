import React from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface ProfileSecurityProps {
  isEditing: boolean;
  isChangingPassword: boolean;
  setIsChangingPassword: (val: boolean) => void;
  formData: any;
  setFormData: (val: any) => void;
  showPassword: any;
  setShowPassword: (val: any) => void;
  passwordValidation: any;
  confirmPasswordMatch: boolean | null;
  getStrengthText: (strength: number) => string;
}

export function ProfileSecurity({
  isEditing,
  isChangingPassword,
  setIsChangingPassword,
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  passwordValidation,
  confirmPasswordMatch,
  getStrengthText,
}: ProfileSecurityProps) {
  return (
    <GlassCard>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#2B6CB0] flex items-center justify-center shadow-lg text-white">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-[#1B3A6B]">Account Security</h3>
            <p className="text-[#2B6CB0] font-medium text-sm">Manage your password and authentication</p>
          </div>
        </div>
        
        {isEditing && (
          <button 
            type="button"
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className={cn(
              "px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm",
              isChangingPassword 
                ? "bg-[#D94F2B] text-white hover:bg-[#c04222]" 
                : "bg-white text-[#1B3A6B] hover:bg-slate-50"
            )}
          >
            {isChangingPassword ? "Cancel Password Change" : "Change Password"}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isChangingPassword && isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-8 bg-white/40 border border-white rounded-3xl"
          >
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPassword.old ? "text" : "password"}
                    value={formData.oldPassword}
                    onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                    className="w-full pr-12 pl-6 py-4 text-sm border-0 rounded-2xl bg-white focus:ring-4 focus:ring-[#2B6CB0]/20 shadow-inner font-medium text-[#1B3A6B]"
                    required={isChangingPassword}
                  />
                  <button type="button" onClick={() => setShowPassword({ ...showPassword, old: !showPassword.old })} className="absolute right-4 top-4 text-slate-400 hover:text-[#1B3A6B] transition-colors p-1">
                    {showPassword.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200/50">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword.new ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className={cn(
                        "w-full pr-12 pl-6 py-4 text-sm border-0 rounded-2xl bg-white focus:ring-4 shadow-inner font-medium text-[#1B3A6B] transition-shadow",
                        formData.newPassword 
                          ? (passwordValidation.isValid ? 'focus:ring-green-500/30 ring-2 ring-green-500' : 'focus:ring-amber-500/30 ring-2 ring-amber-500') 
                          : 'focus:ring-[#2B6CB0]/20'
                      )}
                      required={isChangingPassword}
                    />
                    <button type="button" onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })} className="absolute right-4 top-4 text-slate-400 hover:text-[#1B3A6B] transition-colors p-1">
                      {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {formData.newPassword && (
                    <div className="mt-3 bg-white/50 p-4 rounded-xl space-y-3 border border-white">
                      <div className="flex justify-between items-center font-bold text-xs">
                        <span className="text-slate-500">Strength Indicator</span>
                        <span className={passwordValidation.strength <= 40 ? 'text-red-500' : passwordValidation.strength <= 80 ? 'text-amber-500' : 'text-green-500'}>
                          {getStrengthText(passwordValidation.strength)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-wider">
                        <span className={cn("px-2 py-1 rounded-md", passwordValidation.requirements.minLength ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400')}>8+ Chars</span>
                        <span className={cn("px-2 py-1 rounded-md", passwordValidation.requirements.upperCase ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400')}>Upper</span>
                        <span className={cn("px-2 py-1 rounded-md", passwordValidation.requirements.lowerCase ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400')}>Lower</span>
                        <span className={cn("px-2 py-1 rounded-md", passwordValidation.requirements.numbers ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400')}>Number</span>
                        <span className={cn("px-2 py-1 rounded-md", passwordValidation.requirements.specialChar ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400')}>Special</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showPassword.confirm ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={cn(
                        "w-full pr-12 pl-6 py-4 text-sm border-0 rounded-2xl bg-white focus:ring-4 shadow-inner font-medium text-[#1B3A6B] transition-shadow",
                        formData.confirmPassword 
                          ? (confirmPasswordMatch ? 'focus:ring-green-500/30 ring-2 ring-green-500' : 'focus:ring-red-500/30 ring-2 ring-red-500') 
                          : 'focus:ring-[#2B6CB0]/20'
                      )}
                      required={isChangingPassword}
                    />
                    <button type="button" onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })} className="absolute right-4 top-4 text-slate-400 hover:text-[#1B3A6B] transition-colors p-1">
                      {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <p className={`text-xs mt-2 font-bold pl-2 ${confirmPasswordMatch ? 'text-green-600' : 'text-red-600'}`}>
                      {confirmPasswordMatch ? '✓ Passwords match perfectly' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
