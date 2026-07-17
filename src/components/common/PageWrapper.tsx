import React from "react";

/**
 * PageWrapper — Root container standar untuk semua halaman.
 *
 * Menjamin layout yang seragam antar halaman:
 * - Padding: p-4 (mobile) → sm:p-6 (tablet+)
 * - Spacing: space-y-4 (mobile) → md:space-y-6 (desktop)
 * - Tidak ada max-w, border, shadow, atau margin ekstra
 *
 * Pola ini sama persis dengan KPI Tracking, Inspeksi KPC,
 * PM Schedule, dan semua halaman utama lainnya.
 *
 * @example
 * ```tsx
 * import { PageWrapper } from "../common/PageWrapper";
 *
 * export default function MyPage() {
 *   return (
 *     <PageWrapper>
 *       <div className="md:hidden">
 *         <MobilePageHeader ... />
 *       </div>
 *       <div className="hidden md:block">
 *         {/* Desktop header & content *\/}
 *       </div>
 *     </PageWrapper>
 *   );
 * }
 * ```
 */

interface PageWrapperProps {
  children: React.ReactNode;
  /** Extra className untuk kasus spesifik (jarang dipakai) */
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = "" }) => {
  return (
    <div className={`p-4 sm:p-6 space-y-4 md:space-y-6 ${className}`.trim()}>
      {children}
    </div>
  );
};

export default PageWrapper;
