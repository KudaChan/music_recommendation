'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSettings, ColorScheme } from '@/app/types';

// Default color schemes
export const colorSchemes: ColorScheme[] = [
  { id: 'blue', name: 'Blue', primary: 'blue', secondary: 'indigo', accent: 'sky' },
  { id: 'purple', name: 'Purple', primary: 'purple', secondary: 'violet', accent: 'fuchsia' },
  { id: 'green', name: 'Green', primary: 'green', secondary: 'emerald', accent: 'lime' },
  { id: 'red', name: 'Red', primary: 'red', secondary: 'rose', accent: 'orange' },
  { id: 'neutral', name: 'Neutral', primary: 'neutral', secondary: 'stone', accent: 'zinc' },
];

// Default settings
const defaultSettings: UserSettings = {
  theme: 'system',
  colorScheme: 'blue',
  notificationsEnabled: false,
  autoplay: true,
  defaultVolume: 70,
  highQualityAudio: false,
  dataCollection: true,
};

// Create context
type SettingsContextType = {
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  colorSchemes: ColorScheme[];
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to load settings:', error);
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Apply theme and color scheme when settings change
  useEffect(() => {
    if (!isLoaded) return;

    console.log('Settings updated:', settings);
    
    // Save settings to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));

    // Apply theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = 
      settings.theme === 'dark' || 
      (settings.theme === 'system' && prefersDark);
    
    console.log('Applying dark mode:', isDark);
    document.documentElement.classList.toggle('dark', isDark);
    
    // Log the current classes on the HTML element to verify
    console.log('HTML classes:', document.documentElement.className);

    // Apply color scheme
    const selectedScheme = colorSchemes.find(scheme => scheme.id === settings.colorScheme) || colorSchemes[0];
    document.documentElement.style.setProperty('--primary-color', selectedScheme.primary);
    document.documentElement.style.setProperty('--secondary-color', selectedScheme.secondary);
    document.documentElement.style.setProperty('--accent-color', selectedScheme.accent);
    
    // Add data-color-scheme attribute for CSS variables
    document.documentElement.setAttribute('data-color-scheme', selectedScheme.id);
  }, [settings, isLoaded]);

  // Update settings
  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Open/close settings panel
  const openSettings = () => setIsSettingsOpen(true);
  const closeSettings = () => setIsSettingsOpen(false);

  return (
    <SettingsContext.Provider 
      value={{ 
        settings, 
        updateSettings, 
        colorSchemes,
        isSettingsOpen,
        openSettings,
        closeSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// Hook for using the settings context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
