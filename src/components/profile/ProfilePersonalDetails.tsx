import React from "react";
import { User, Save } from "lucide-react";
import { GlassCard } from "../ui/GlassCard";
import { cn } from "../../lib/utils";

interface ProfilePersonalDetailsProps {
  fullName: string;
  email: string;
  division: string;
  employeeId: string;
  isEditing: boolean;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onEmployeeIdChange: (value: string) => void;
  onCancelEdit: () => void;
}

export function ProfilePersonalDetails({
  fullName,
  email,
  division,
  employeeId,
  isEditing,
  onFullNameChange,
  onEmailChange,
  onEmployeeIdChange,
  onCancelEdit,
}: ProfilePersonalDetailsProps) {
  return (
    <GlassCard glowColor="bg-[#2B6CB0]">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#2B6CB0] flex items-center justify-center shadow-lg text-white">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-[#1B3A6B]">Personal Details</h3>
          <p className="text-[#2B6CB0] font-medium text-sm">Informasi dasar akun Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
            Full Name
          </label>
          <input 
            type="text" 
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            disabled={!isEditing}
            className={cn(
              "w-full px-6 py-4 rounded-2xl text-sm font-bold text-[#1B3A6B] transition-all",
              isEditing 
                ? "bg-white/60 border-2 border-white focus:border-[#2B6CB0] focus:ring-4 focus:ring-[#2B6CB0]/20 shadow-inner" 
                : "bg-white/40 border-2 border-transparent shadow-sm opacity-90"
            )}
          />
        </div>
        
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
            Email Address
          </label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={!isEditing}
            className={cn(
              "w-full px-6 py-4 rounded-2xl text-sm font-bold text-[#1B3A6B] transition-all",
              isEditing 
                ? "bg-white/60 border-2 border-white focus:border-[#2B6CB0] focus:ring-4 focus:ring-[#2B6CB0]/20 shadow-inner" 
                : "bg-white/40 border-2 border-transparent shadow-sm opacity-90"
            )}
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
            Division
          </label>
          <div className="w-full px-6 py-4 bg-white/40 border-2 border-transparent shadow-sm rounded-2xl text-sm font-bold text-[#1B3A6B] opacity-90">
            {division || "Outsite Pit"}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
            Employee ID
          </label>
          {isEditing ? (
            <input 
              type="text" 
              value={employeeId}
              onChange={(e) => onEmployeeIdChange(e.target.value)}
              className="w-full px-6 py-4 bg-white/60 border-2 border-white focus:border-[#2B6CB0] focus:ring-4 focus:ring-[#2B6CB0]/20 shadow-inner rounded-2xl text-sm font-bold text-[#1B3A6B] transition-all"
            />
          ) : (
            <div className="w-full px-6 py-4 bg-white/40 border-2 border-transparent shadow-sm rounded-2xl text-sm font-bold text-[#1B3A6B] opacity-90">
              {employeeId || "11437"}
            </div>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-10 flex flex-col sm:flex-row justify-end gap-4 border-t border-slate-200/50 pt-8">
          <button 
            type="button" 
            onClick={onCancelEdit}
            className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-[#1B3A6B] font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            Batal Edit
          </button>
          <button 
            type="submit"
            className="px-10 py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-3 shadow-xl transition-all bg-[#1B3A6B] hover:opacity-90 active:scale-95 shadow-[#1B3A6B]/20 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            <span>Save Profile</span>
          </button>
        </div>
      )}
    </GlassCard>
  );
}
