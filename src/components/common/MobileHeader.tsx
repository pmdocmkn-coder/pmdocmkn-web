import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Menu, LucideIcon } from "lucide-react";

/**
 * MobileHeader — Mobile Integrated Header
 * DESIGN.md specs:
 * - Height: 56px
 * - Background: white, bottom border #E2E8F0
 * - Left: back arrow OR hamburger (44x44 touch target)
 * - Center: page title (16px, weight 600)
 * - Right: action icons (44x44 each, max 2 icons)
 * - Safe area aware (iOS notch, Android status bar)
 *
 * Only visible on mobile (<768px) via md:hidden.
 */

interface ActionButton {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  badge?: number;
}

interface MobileHeaderProps {
  title: string;
  /** "back" shows ArrowLeft, "menu" shows hamburger */
  leftAction?: "back" | "menu";
  onMenuOpen?: () => void;
  /** Max 2 action buttons on the right */
  actions?: ActionButton[];
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  leftAction = "back",
  onMenuOpen,
  actions = [],
}) => {
  const navigate = useNavigate();

  const handleLeft = () => {
    if (leftAction === "back") {
      navigate(-1);
    } else {
      onMenuOpen?.();
    }
  };

  // Clamp to max 2 actions
  const visibleActions = actions.slice(0, 2);

  return (
    <header
      className="
        flex md:hidden items-center justify-between
        bg-white border-b border-[#E2E8F0]
        pt-safe sticky top-0 z-30 flex-shrink-0
      "
      style={{ height: 56 }}
    >
      {/* Left: back / hamburger */}
      <button
        onClick={handleLeft}
        aria-label={leftAction === "back" ? "Kembali" : "Buka menu"}
        className="flex items-center justify-center text-[#1A202C] hover:bg-[#F7F8FA] rounded-lg transition-colors flex-shrink-0"
        style={{ width: 44, height: 44, marginLeft: 4 }}
      >
        {leftAction === "back" ? (
          <ArrowLeft className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Center: title */}
      <h1 className="flex-1 text-center text-[16px] font-semibold text-[#1A202C] truncate px-2">
        {title}
      </h1>

      {/* Right: action buttons */}
      <div className="flex items-center flex-shrink-0" style={{ marginRight: 4 }}>
        {visibleActions.length > 0 ? (
          visibleActions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              aria-label={action.label}
              className="relative flex items-center justify-center text-[#1A202C] hover:bg-[#F7F8FA] rounded-lg transition-colors"
              style={{ width: 44, height: 44 }}
            >
              <action.icon className="w-5 h-5" />
              {action.badge !== undefined && action.badge > 0 && (
                <span className="absolute top-2 right-2 min-w-[14px] h-[14px] bg-[#D94F2B] rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5 border border-white">
                  {action.badge > 9 ? "9+" : action.badge}
                </span>
              )}
            </button>
          ))
        ) : (
          // Spacer to keep title centered
          <div style={{ width: 44 }} />
        )}
      </div>
    </header>
  );
};

export default MobileHeader;
