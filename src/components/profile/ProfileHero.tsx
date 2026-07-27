import React from "react";
import { Camera, Eye, Mail, Save, Pencil } from "lucide-react";
import { cn } from "../../lib/utils";

interface ProfileHeroProps {
  fullName: string;
  roleName: string;
  email: string;
  employeeId: string;
  photoUrl?: string | null;
  getInitials: () => string;
  hasPhoto: boolean;
  isEditing: boolean;
  onAvatarClick: () => void;
  onPreviewClick: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onSaveProfile: (e: React.FormEvent) => void;
}

export function ProfileHero({
  fullName,
  roleName,
  email,
  employeeId,
  photoUrl,
  getInitials,
  hasPhoto,
  isEditing,
  onAvatarClick,
  onPreviewClick,
  onCancelEdit,
  onStartEdit,
  onSaveProfile,
}: ProfileHeroProps) {
  return (
    <div className="liquid-glass rounded-[48px] p-10 lg:p-14 relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#D94F2B]/10 rounded-full blur-[80px]"></div>

      {!isEditing && (
        <button
          type="button"
          onClick={onStartEdit}
          className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20 px-4 py-2 lg:px-6 lg:py-3 rounded-2xl bg-white/50 hover:bg-white border border-slate-200 text-[#1B3A6B] font-bold transition-all active:scale-95 shadow-sm flex items-center gap-2 backdrop-blur-sm"
        >
          <Pencil className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="hidden sm:inline">Edit Profile</span>
        </button>
      )}
      <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
        <div className="relative group">
          {hasPhoto ? (
            <div 
              className="w-44 h-44 rounded-[40px] overflow-hidden bg-white shadow-2xl ring-8 ring-white/30 cursor-pointer transition-transform duration-300 group-hover:scale-105" 
              onClick={onPreviewClick}
            >
              <img src={photoUrl!} alt={fullName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-[#1B3A6B]/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                <Eye className="text-white w-10 h-10" />
              </div>
            </div>
          ) : (
            <div 
              className="w-44 h-44 rounded-[40px] overflow-hidden bg-[#1B3A6B] shadow-2xl ring-8 ring-white/30 cursor-pointer transition-transform duration-300 group-hover:scale-105 flex items-center justify-center" 
              onClick={onAvatarClick}
            >
              <span className="text-white text-5xl font-bold">{getInitials()}</span>
              <div className="absolute inset-0 bg-[#1B3A6B]/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                <Camera className="text-white w-10 h-10" />
              </div>
            </div>
          )}
          
          <button 
            type="button"
            onClick={onAvatarClick}
            className="absolute -bottom-4 -right-4 w-14 h-14 bg-[#1B3A6B] text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all border-4 border-white z-20"
            title="Ubah Foto Profil"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 space-y-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="flex flex-col lg:flex-row items-center gap-4 flex-wrap">
              <h2 className="text-4xl lg:text-5xl font-extrabold text-[#1B3A6B] tracking-tight">{fullName}</h2>
              <span className="px-6 py-2 bg-gradient-to-r from-[#2B6CB0]/10 to-[#1B3A6B]/5 border border-[#2B6CB0]/20 text-[#2B6CB0] font-bold text-xs rounded-full tracking-[0.2em] uppercase">
                {roleName || "TEKNISI WKS"}
              </span>
            </div>
            <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-4 lg:gap-8 text-slate-500 font-medium">
              <div className="flex items-center justify-center gap-2">
                <Mail className="text-[#2B6CB0] w-5 h-5" />
                <span>{email}</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-white/50 px-3 py-1 rounded-lg shadow-sm border border-white">
                <span className="font-bold text-[#2B6CB0]">ID</span>
                <span className="font-mono text-slate-700">{employeeId || "-"}</span>
              </div>
            </div>
          </div>
          

        </div>
      </div>
    </div>
  );
}
