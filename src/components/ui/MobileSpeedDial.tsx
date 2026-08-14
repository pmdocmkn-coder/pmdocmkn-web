import React, { useState } from 'react';
import { MoreVertical, X } from 'lucide-react';

export interface SpeedDialAction {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export interface MobileSpeedDialProps {
  actions: SpeedDialAction[];
  mainAction?: {
    icon: React.ReactNode;
    label: React.ReactNode;
    onClick: () => void;
    className?: string;
  };
}

export function MobileSpeedDial({ actions, mainAction }: MobileSpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-[100px] right-4 z-40 flex flex-col items-end gap-3">
      {/* Expanded Menu */}
      <div 
        className={`flex flex-col items-end gap-3 transition-all duration-300 origin-bottom ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-10 pointer-events-none'
        }`}
      >
        {actions.map((action, index) => (
          <button 
            key={index}
            onClick={() => {
              action.onClick();
              setIsOpen(false);
            }}
            disabled={action.disabled}
            className={`flex items-center gap-2.5 bg-white border border-slate-200 px-4 py-2.5 rounded-full shadow-lg shadow-slate-200/50 font-semibold text-[13px] active:scale-95 ${action.disabled ? 'text-slate-400 cursor-not-allowed' : action.className || 'text-slate-700'}`}
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>

      {/* Main Buttons (Row) */}
      <div className="flex items-center gap-3">
        {actions.length > 0 && (
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-[52px] h-[52px] bg-white border border-slate-200 text-slate-700 flex items-center justify-center rounded-full shadow-xl transition-transform active:scale-95"
          >
            {isOpen ? <X className="w-6 h-6" /> : <MoreVertical className="w-6 h-6" />}
          </button>
        )}

        {mainAction && (
          <button 
            onClick={mainAction.onClick}
            className={`flex items-center gap-2 px-5 h-[52px] rounded-full shadow-xl font-bold transition-all active:scale-95 text-[15px] ${mainAction.className || 'bg-[#D94F2B] hover:bg-[#B83D20] text-white shadow-[#D94F2B]/30'}`}
          >
            {mainAction.icon} {mainAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
