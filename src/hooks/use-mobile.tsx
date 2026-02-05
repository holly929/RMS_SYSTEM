import { useState, useEffect, useMemo } from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : MOBILE_BREAKPOINT
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return useMemo(() => width < MOBILE_BREAKPOINT, [width]);
}
