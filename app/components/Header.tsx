'use client';

import { useState } from 'react';
import { useAuthContext } from '@/app/context/AuthContext';
import { useSettings } from '@/app/context/SettingsContext';
import { IoMusicalNotes, IoMenu, IoClose, IoPersonCircle, IoSettingsOutline } from 'react-icons/io5';
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';
import Link from 'next/link';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user, signOut } = useAuthContext();
  const { openSettings } = useSettings();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleUserMenu = () => setShowUserMenu(!showUserMenu);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <header className="app-header sticky top-0 z-10 shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo and Title */}
        <Link href="/" className="flex items-center space-x-2">
          <IoMusicalNotes className="w-8 h-8" />
          <span className="font-bold text-xl">MoodTunes</span>
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <ThemeToggle />
          {user && (
            <>
              <div className="text-sm opacity-90">
                Welcome, {user.displayName || user.email?.split('@')[0] || 'User'}
              </div>
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  {user.photoURL ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                      <Image 
                        src={user.photoURL} 
                        alt="Profile" 
                        width={32} 
                        height={32}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <IoPersonCircle className="w-8 h-8" />
                  )}
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-800 rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => {
                        openSettings();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      <IoSettingsOutline className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={signOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <IoClose className="h-6 w-6" />
          ) : (
            <IoMenu className="h-6 w-6" />
          )}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden mt-3 pt-3 border-t border-blue-600">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {user.photoURL ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                    <Image 
                      src={user.photoURL} 
                      alt="Profile" 
                      width={32} 
                      height={32}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <IoPersonCircle className="w-8 h-8" />
                )}
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={openSettings}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors text-left flex items-center"
            >
              <IoSettingsOutline className="w-4 h-4 mr-2" />
              Settings
            </button>
            <button
              onClick={signOut}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors text-left"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
