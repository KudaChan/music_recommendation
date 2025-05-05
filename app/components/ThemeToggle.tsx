'use client';

import { useState, useEffect } from 'react';
import { IoSunny, IoMoon } from 'react-icons/io5';
import { useSettings } from '@/app/context/SettingsContext';

export default function ThemeToggle() {
  const { settings, updateSettings } = useSettings();
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme based on settings
  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;
    
    // Determine if dark mode should be active
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = 
      settings.theme === 'dark' || 
      (settings.theme === 'system' && prefersDark);
    
    setDarkMode(isDark);
  }, [settings.theme]);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = darkMode ? 'light' : 'dark';
    console.log('Toggling theme to:', newTheme);
    
    // Update settings
    updateSettings({ theme: newTheme });
    
    // Directly toggle the class on the HTML element
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setDarkMode(!darkMode);
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <IoSunny className="h-5 w-5" />
      ) : (
        <IoMoon className="h-5 w-5" />
      )}
    </button>
  );
}
