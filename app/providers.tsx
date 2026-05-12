'use client';

import { ReactNode } from 'react';
import { GeoLocationTracker } from '@/components/GeoLocationTracker';
import { LocationAccessPrompt } from '@/components/LocationAccessPrompt';
import { AppProvider } from '@/components/contexts/AppContext';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppProvider>
        <GeoLocationTracker />
        <LocationAccessPrompt />
        {children}
        <Toaster position="top-right" richColors />
      </AppProvider>
    </ThemeProvider>
  );
}
