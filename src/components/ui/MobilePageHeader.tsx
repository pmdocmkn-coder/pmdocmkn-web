import React from 'react';
import { Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface MobilePageHeaderProps {
  label: string;
  title: string | React.ReactNode;
  rightAction?: React.ReactNode;
  contentAfterTitle?: React.ReactNode; // For expanded search bars, etc.
  scrollableChips?: React.ReactNode; // For the horizontally scrolling chips/tabs
  className?: string; // Additional classes for the header container
}

export const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
  label,
  title,
  rightAction,
  contentAfterTitle,
  scrollableChips,
  className = ""
}) => {
  const navigate = useNavigate();

  return (
    <div className={`md:hidden pt-4 pb-4 mb-4 bg-white shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-3xl sticky top-0 z-30 flex flex-col ${className}`}>
      <div className="flex items-start justify-between pb-3 px-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1 opacity-80">
            <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">{label}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">
            {title}
          </h1>
        </div>
        <div className="flex gap-2 select-none shrink-0">
          {rightAction}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors shrink-0"
          >
            <Home className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {contentAfterTitle}

      {/* Scrollable Chips/Tabs */}
      {scrollableChips && (
        <div className="flex gap-2 px-4 pb-1 overflow-x-auto no-scrollbar relative w-full items-center">
          {scrollableChips}
          {/* Spacer to prevent rightmost chip from getting cut off due to overflow padding bugs */}
          <div className="w-1 shrink-0"></div>
        </div>
      )}
    </div>
  );
};
