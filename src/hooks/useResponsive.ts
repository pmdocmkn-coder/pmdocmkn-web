import { useMediaQuery } from './useMediaQuery';

/**
 * Breakpoints from DESIGN.md:
 * - Mobile: < 768px (smartphones, portrait tablets)
 * - Tablet: 768px - 1024px (landscape tablets)
 * - Desktop: > 1024px (laptop, desktop monitors)
 */

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Convenience flags
  isMobileOrTablet: boolean;
  isTabletOrDesktop: boolean;
}

/**
 * useResponsive Hook
 * 
 * Returns responsive state for dual rendering strategy
 * Based on breakpoints defined in DESIGN.md
 * 
 * @returns ResponsiveState object with boolean flags
 * 
 * @example
 * const { isMobile, isDesktop } = useResponsive();
 * 
 * return (
 *   <>
 *     {isMobile && <MobileBottomNav />}
 *     {isDesktop && <Sidebar />}
 *   </>
 * );
 */
export function useResponsive(): ResponsiveState {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    
    // Convenience flags
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
  };
}

/**
 * useBreakpoint Hook
 * 
 * Returns the current breakpoint name
 * Useful for conditional logic or debugging
 * 
 * @returns 'mobile' | 'tablet' | 'desktop'
 * 
 * @example
 * const breakpoint = useBreakpoint();
 * console.log('Current breakpoint:', breakpoint);
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  const { isMobile, isTablet } = useResponsive();
  
  if (isMobile) return 'mobile';
  if (isTablet) return 'tablet';
  return 'desktop';
}
