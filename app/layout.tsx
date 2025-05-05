import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import SettingsPanelContainer from './components/SettingsPanelContainer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Music Recommendation App',
  description: 'Get personalized music recommendations based on your mood',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--background)] text-[var(--foreground)]`}>
        <AuthProvider>
          <SettingsProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">
                {children}
              </main>
            </div>
            <SettingsPanelContainer />
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
