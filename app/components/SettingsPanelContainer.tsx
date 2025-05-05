'use client';

import { useSettings } from '@/app/context/SettingsContext';
import SettingsPanel from './SettingsPanel';

export default function SettingsPanelContainer() {
  const { isSettingsOpen, closeSettings } = useSettings();
  
  if (!isSettingsOpen) return null;
  
  return <SettingsPanel onClose={closeSettings} />;
}