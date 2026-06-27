import { useEffect, useState } from 'react';

/**
 * useMediaQuery Hook
 * 
 * Detects if a CSS media query matches the current viewport
 * 
 * @param query - CSS media query string (e.g., "(min-width: 1024px)")
 * @returns boolean - true if query matches, false otherwise
 * 
 * @example
 * const isDesktop = useMediaQuery("(min-width: 1024px)");
 * const isMobile = useMediaQuery("(max-width: 767px)");
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Check if window is defined (SSR safety)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQueryList.matches);

    // Modern browsers: addEventListener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Listen for changes
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(handleChange);
    }

    // Cleanup
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}
