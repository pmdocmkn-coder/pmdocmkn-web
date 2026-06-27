import React from 'react';

/**
 * MobilePageHeader — Standardized inline mobile page header
 *
 * Design pattern (sesuai Supervisi Warehouse):
 * - Inline white card (NOT sticky) — part of content flow
 * - Icon in KPC-colored rounded square (optional)
 * - Label: 10px uppercase, #2B6CB0
 * - Title: bold 22px, #1A202C
 * - Subtitle: 13px, #718096 (optional)
 * - Right action: 40x40 rounded-[10px] button (consistent)
 *
 * Usage:
 * <MobilePageHeader
 *   label="Warehouse"
 *   title="Histori Peminjaman"
 *   icon={<History className="w-5 h-5 text-[#2B6CB0]" />}
 *   onBack={() => window.history.back()}
 * />
 */

export interface MobilePageHeaderProps {
  label: string;
  title: string | React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
  contentAfterTitle?: React.ReactNode;
  scrollableChips?: React.ReactNode;
  className?: string;
}

export const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
  label,
  title,
  subtitle,
  icon,
  iconBg = 'bg-[#EBF4FF]',
  rightAction,
  onBack,
  contentAfterTitle,
  scrollableChips,
  className = '',
}) => {
  return (
    <div className={`md:hidden bg-white rounded-[14px] border border-[#E2E8F0] shadow-sm mb-4 overflow-hidden ${className}`}>
      <div className="flex items-start gap-4 p-4">
        {/* Icon */}
        {icon && (
          <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            {icon}
          </div>
        )}

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#2B6CB0] tracking-[0.1em] uppercase mb-0.5">
            {label}
          </p>
          <h1 className="text-[20px] font-bold text-[#1A202C] leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] text-[#718096] mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Right action */}
        {rightAction && (
          <div className="flex gap-2 flex-shrink-0 items-start">
            {rightAction}
          </div>
        )}
      </div>

      {/* Content after title (search bar, badges, etc.) */}
      {contentAfterTitle && (
        <div className="px-4 pb-4">
          {contentAfterTitle}
        </div>
      )}

      {/* Scrollable chips/tabs */}
      {scrollableChips && (
        <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
          {scrollableChips}
          <div className="w-1 flex-shrink-0" />
        </div>
      )}
    </div>
  );
};

/**
 * MobileActionButton — Standardized 40x40 icon button
 * Used in page headers for back/action buttons
 */
export const MobileActionButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'primary';
  'aria-label'?: string;
}> = ({ onClick, children, variant = 'default', 'aria-label': ariaLabel }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={`w-10 h-10 flex items-center justify-center rounded-[10px] border transition-colors flex-shrink-0 ${
      variant === 'primary'
        ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white hover:bg-[#2B6CB0]'
        : 'bg-[#F7F8FA] border-[#E2E8F0] text-[#718096] hover:bg-[#EBF4FF] hover:text-[#2B6CB0]'
    }`}
  >
    {children}
  </button>
);
