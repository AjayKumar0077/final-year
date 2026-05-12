'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FEATURES } from '@/lib/config';

export interface AppContextType {
  isInitialized: boolean;
  isLoading: boolean;
  features: typeof FEATURES;
  appVersion: string;
  environment: 'development' | 'production';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize app
    const initializeApp = async () => {
      try {
        // Simulate initialization tasks
        // - Load feature flags
        // - Initialize analytics
        // - Load user preferences
        // - Setup realtime listeners
        
        // In production, this could include:
        // - Checking feature availability from server
        // - Loading A/B test variants
        // - Initializing third-party services
        
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        // Don't block app from loading even if initialization fails
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

  const value: AppContextType = {
    isInitialized,
    isLoading,
    features: FEATURES,
    appVersion,
    environment,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to use app context
 */
export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

/**
 * Hook to check if feature is enabled
 */
export function useFeature(featureName: keyof typeof FEATURES): boolean {
  const { features } = useApp();
  return features[featureName];
}

/**
 * Hook to get app version
 */
export function useAppVersion(): string {
  const { appVersion } = useApp();
  return appVersion;
}

/**
 * Hook to get environment
 */
export function useEnvironment(): 'development' | 'production' {
  const { environment } = useApp();
  return environment;
}

/**
 * Hook to check if app is ready
 */
export function useAppReady(): boolean {
  const { isInitialized, isLoading } = useApp();
  return isInitialized && !isLoading;
}
