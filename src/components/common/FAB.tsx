import React from "react";
import { Plus, LucideIcon } from "lucide-react";

/**
 * FAB — Floating Action Button (Mobile only)
 * DESIGN.md specs:
 * - Position: fixed bottom-right, 16px from edges (above bottom nav)
 * - Size: 56px circle
 * - Background: #D94F2B (KPC Orange)
 * - Icon: white, 24px
 * - Shadow: 0 4px 12px rgba(217,79,43,0.4)
 * - Press: scale 0.95
 *
 * Only renders on mobile (<768px).
 * Use only for ONE primary creation action per screen.
 */

interface FABProps {
  onClick: () => void;
  /** Lucide icon component — defaults to Plus */
  icon?: LucideIcon;
  /** aria-label for accessibility */
  label?: string;
  /**
   * Extra bottom offset in px.
   * Default: 80 (above bottom nav 64px + 16px gap).
   * Use 16 when no bottom nav present.
   */
  bottomOffset?: number;
}

const FAB: React.FC<FABProps> = ({
  onClick,
  icon: Icon = Plus,
  label = "Tambah",
  bottomOffset = 80,
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="
        fixed right-4 z-40 md:hidden
        flex items-center justify-center
        rounded-full text-white
        active:scale-95 transition-transform duration-100
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D94F2B] focus-visible:ring-offset-2
      "
      style={{
        bottom: bottomOffset,
        width: 56,
        height: 56,
        backgroundColor: "#D94F2B",
        boxShadow: "0 4px 12px rgba(217, 79, 43, 0.4)",
      }}
    >
      <Icon className="w-6 h-6" strokeWidth={2.5} />
    </button>
  );
};

export default FAB;
