import React from "react";
import { GlassCard } from "../ui/GlassCard";
import { CheckCircle, ShieldCheck } from "lucide-react";
import { convertUTCtoWITA } from "../../utils/dateUtils";

interface ProfileInsightsProps {
  createdAt?: string | null;
  lastLogin?: string | null;
  profileCompletion: number;
}

export function ProfileInsights({
  createdAt,
  lastLogin,
  profileCompletion,
}: ProfileInsightsProps) {
  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = convertUTCtoWITA(dateString);
    if (!date) return "-";
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${date.getDate().toString().padStart(2, "0")} ${
      monthNames[date.getMonth()]
    } ${date.getFullYear()} pukul ${date.getHours().toString().padStart(2, "0")}.${date
      .getMinutes()
      .toString()
      .padStart(2, "0")} WITA`;
  };

  return (
    <div className="space-y-10">
      {/* Stats Widget */}
      <GlassCard 
        glowColor="bg-[#D94F2B]" 
        className="flex flex-col items-center text-center p-12"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#2B6CB0] flex items-center justify-center shadow-xl shadow-[#1B3A6B]/20 mb-6 text-white float-anim">
          <ShieldCheck className="w-12 h-12" />
        </div>
        <h3 className="text-xl font-bold text-[#1B3A6B] mb-2">Verified Profile</h3>
        <p className="text-[#2B6CB0] font-medium text-sm mb-8">
          Member since {createdAt ? new Date(createdAt).getFullYear() : "2024"}
        </p>

        <div className="w-full space-y-3">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-slate-500 uppercase tracking-wider text-xs">Completion</span>
            <span className="text-[#D94F2B] text-base">{profileCompletion}%</span>
          </div>
          <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-[#D94F2B] to-[#E86547] relative"
              style={{ width: `${profileCompletion}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Platform Insight */}
      <GlassCard>
        <h3 className="text-lg font-bold text-[#1B3A6B] mb-8 flex items-center gap-3">
          <span className="w-2 h-8 bg-[#D94F2B] rounded-full"></span>
          Platform Insight
        </h3>

        <div className="space-y-6">
          <div className="flex justify-between items-center p-4 rounded-2xl bg-white/40 border border-white hover:bg-white/60 transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Registered</p>
              <p className="text-sm font-bold text-[#1B3A6B]">
                {formatDateTime(createdAt)}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between items-center p-4 rounded-2xl bg-white/40 border border-white hover:bg-white/60 transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Last Login</p>
              <p className="text-sm font-bold text-[#1B3A6B]">
                {formatDateTime(lastLogin)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/40 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-bold text-[#1B3A6B]">System Access</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm font-bold text-[#1B3A6B]">Data View Rights</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
