'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ColorScheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'lavender';

interface ColorSchemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextType | undefined>(undefined);

export function ColorSchemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');

  // Load color scheme from localStorage on mount
  useEffect(() => {
    const savedScheme = localStorage.getItem('colorScheme') as ColorScheme | null;
    if (savedScheme) {
      setColorScheme(savedScheme);
      document.documentElement.classList.add(`color-scheme-${savedScheme}`);
    } else {
      document.documentElement.classList.add('color-scheme-default');
    }
  }, []);

  // Update when color scheme changes
  const handleSetColorScheme = (scheme: ColorScheme) => {
    // Remove all existing color scheme classes
    document.documentElement.classList.remove(
      'color-scheme-default',
      'color-scheme-ocean',
      'color-scheme-forest',
      'color-scheme-sunset',
      'color-scheme-lavender'
    );
    
    // Add new color scheme class
    document.documentElement.classList.add(`color-scheme-${scheme}`);
    
    // Save to state and localStorage
    setColorScheme(scheme);
    localStorage.setItem('colorScheme', scheme);
  };

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, setColorScheme: handleSetColorScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}

export function useColorScheme() {
  const context = useContext(ColorSchemeContext);
  if (context === undefined) {
    throw new Error('useColorScheme must be used within a ColorSchemeProvider');
  }
  return context;
}