'use client';

import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Update the state with the current value
      const updateMatches = () => setMatches(media.matches);
      
      // Set the initial value
      updateMatches();
      
      // Listen for changes
      media.addEventListener('change', updateMatches);
      
      // Clean up
      return () => {
        media.removeEventListener('change', updateMatches);
      };
    }
    
    return undefined;
  }, [query]);
  
  return matches;
} 