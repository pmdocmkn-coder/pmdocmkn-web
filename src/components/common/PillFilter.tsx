import React from "react";

/**
 * PillFilter — Horizontal scrollable filter chips (Mobile)
 * DESIGN.md specs:
 * - Container: horizontal scroll, no scrollbar visible
 * - Pill: height 36px, padding 0 16px, radius 18px
 * - Inactive: white bg, #E2E8F0 border, #1A202C text
 * - Active: #D94F2B bg, white text, no border
 * - Gap: 8px between pills
 * - First/last: 16px margin from screen edge
 */

interface PillOption<T extends string | number = string> {
  value: T;
  label: string;
  count?: number;
}

interface PillFilterProps<T extends string | number = string> {
  options: PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

function PillFilter<T extends string | number = string>({
  options,
  value,
  onChange,
  className = "",
}: PillFilterProps<T>) {
  return (
    <div
      className={`flex overflow-x-auto no-scrollbar gap-2 px-4 py-3 ${className}`}
      role="group"
      aria-label="Filter"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className="flex-shrink-0 flex items-center gap-1.5 font-medium text-[14px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D94F2B]"
            style={{
              height: 36,
              padding: "0 16px",
              borderRadius: 18,
              backgroundColor: active ? "#D94F2B" : "#FFFFFF",
              color: active ? "#FFFFFF" : "#1A202C",
              border: active ? "none" : "1px solid #E2E8F0",
            }}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className="text-[11px] font-semibold rounded-full px-1.5 py-0.5 leading-none"
                style={{
                  backgroundColor: active ? "rgba(255,255,255,0.25)" : "#F7F8FA",
                  color: active ? "#FFFFFF" : "#718096",
                }}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default PillFilter;
