'use client';

import { useState, useEffect } from 'react';
import { useSettings, colorSchemes } from '@/app/context/SettingsContext';
import ThemeToggle from './ThemeToggle';
import { 
  IoCloseOutline, 
  IoSettingsOutline, 
  IoColorPaletteOutline,
  IoNotificationsOutline,
  IoVolumeHighOutline,
  IoShieldOutline
} from 'react-icons/io5';

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useSettings();
  
  // Local state for settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(settings.notificationsEnabled);
  const [autoplay, setAutoplay] = useState(settings.autoplay);
  const [defaultVolume, setDefaultVolume] = useState(settings.defaultVolume);
  const [highQualityAudio, setHighQualityAudio] = useState(settings.highQualityAudio);
  const [dataCollection, setDataCollection] = useState(settings.dataCollection);
  const [selectedColorScheme, setSelectedColorScheme] = useState(settings.colorScheme);

  // Save settings when component unmounts
  useEffect(() => {
    return () => {
      updateSettings({
        notificationsEnabled,
        autoplay,
        defaultVolume,
        highQualityAudio,
        dataCollection,
        colorScheme: selectedColorScheme
      });
    };
  }, [
    notificationsEnabled, 
    autoplay, 
    defaultVolume, 
    highQualityAudio, 
    dataCollection, 
    selectedColorScheme, 
    updateSettings
  ]);

  // Handle notification toggle
  const handleNotificationToggle = async () => {
    try {
      if (!notificationsEnabled) {
        if (!('Notification' in window)) {
          alert('This browser does not support desktop notifications');
          return;
        }

        // Request permission (this will prompt the user for permission)
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
          alert('Permission for notifications was denied');
          return;
        }

        // Register service worker (this will prompt the user for permission)
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/'
        });
        
        // Subscribe to push notifications (this will prompt the user for permission)
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
        
        // Send subscription to server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ subscription }),
        });
        
        setNotificationsEnabled(true);
      } else {
        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;
        
        // Get push subscription
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          // Unsubscribe from push notifications
          await subscription.unsubscribe();
          
          // Send unsubscribe request to server
          await fetch('/api/notifications/unsubscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        }
        
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert('Failed to toggle notifications. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[var(--neutral-900)] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[var(--neutral-200)] dark:border-[var(--neutral-800)]">
          <h2 className="text-lg font-semibold flex items-center">
            <IoSettingsOutline className="w-5 h-5 mr-2" />
            Settings
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--neutral-100)] dark:hover:bg-[var(--neutral-800)] transition-colors"
            aria-label="Close settings"
          >
            <IoCloseOutline className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {/* Appearance Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--neutral-500)] dark:text-[var(--neutral-400)] mb-3 flex items-center">
              <IoColorPaletteOutline className="w-4 h-4 mr-2" />
              Appearance
            </h3>
            
            <div className="bg-[var(--neutral-50)] dark:bg-[var(--neutral-800)] rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-[var(--neutral-500)] dark:text-[var(--neutral-400)]">
                    Switch between light and dark mode
                  </p>
                </div>
                <ThemeToggle />
              </div>
              
              {/* Color Scheme Selector */}
              <div>
                <p className="font-medium mb-2">Color Scheme</p>
                <div className="grid grid-cols-5 gap-2">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => setSelectedColorScheme(scheme.id)}
                      className={`relative p-1 rounded-full border-2 transition-all ${
                        selectedColorScheme === scheme.id 
                          ? 'border-[var(--primary-500)] scale-110' 
                          : 'border-transparent hover:border-[var(--neutral-300)] dark:hover:border-[var(--neutral-600)]'
                      }`}
                      aria-label={`${scheme.name} color scheme`}
                      title={scheme.name}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex space-x-0.5 mb-1">
                          <div className={`w-3 h-3 rounded-full bg-[var(--${scheme.primary}-500)]`}></div>
                          <div className={`w-3 h-3 rounded-full bg-[var(--${scheme.secondary}-500)]`}></div>
                          <div className={`w-3 h-3 rounded-full bg-[var(--${scheme.accent}-500)]`}></div>
                        </div>
                        <span className="text-xs font-medium">{scheme.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Notifications Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--neutral-500)] dark:text-[var(--neutral-400)] mb-3 flex items-center">
              <IoNotificationsOutline className="w-4 h-4 mr-2" />
              Notifications
            </h3>
            
            <div className="bg-[var(--neutral-50)] dark:bg-[var(--neutral-800)] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-[var(--neutral-500)] dark:text-[var(--neutral-400)]">
                    Get notified about new recommendations
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={notificationsEnabled}
                    onChange={handleNotificationToggle}
                  />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Playback Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--neutral-500)] dark:text-[var(--neutral-400)] mb-3 flex items-center">
              <IoVolumeHighOutline className="w-4 h-4 mr-2" />
              Playback
            </h3>
            
            <div className="bg-[var(--neutral-50)] dark:bg-[var(--neutral-800)] rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Autoplay</p>
                  <p className="text-sm text-[var(--neutral-500)] dark:text-[var(--neutral-400)]">
                    Automatically play songs when selected
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={autoplay}
                    onChange={() => setAutoplay(!autoplay)}
                  />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">Default Volume</p>
                  <span className="text-sm font-medium">{defaultVolume}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={defaultVolume}
                  onChange={(e) => setDefaultVolume(parseInt(e.target.value))}
                  className="w-full h-2 bg-[var(--neutral-200)] rounded-lg appearance-none cursor-pointer dark:bg-[var(--neutral-700)] accent-[var(--primary-600)]"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">High Quality Audio</p>
                  <p className="text-sm text-[var(--neutral-500)] dark:text-[var(--neutral-400)]">
                    Stream music at higher quality (uses more data)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={highQualityAudio}
                    onChange={() => setHighQualityAudio(!highQualityAudio)}
                  />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Privacy Section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-[var(--neutral-500)] dark:text-[var(--neutral-400)] mb-3 flex items-center">
              <IoShieldOutline className="w-4 h-4 mr-2" />
              Privacy
            </h3>
            
            <div className="bg-[var(--neutral-50)] dark:bg-[var(--neutral-800)] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Collection</p>
                  <p className="text-sm text-[var(--neutral-500)] dark:text-[var(--neutral-400)]">
                    Allow anonymous usage data to improve recommendations
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={dataCollection}
                    onChange={() => setDataCollection(!dataCollection)}
                  />
                  <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-end pt-4 border-t border-[var(--neutral-200)] dark:border-[var(--neutral-800)]">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
