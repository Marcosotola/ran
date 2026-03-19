'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToSettings, AppSettings } from '@/lib/firebase/settings';
import { usePathname } from 'next/navigation';

interface SubscriptionContextType {
  settings: AppSettings | null;
  isActive: boolean;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  settings: null,
  isActive: true,
  isLoading: true,
});

export const useAppSubscription = () => useContext(SubscriptionContext);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    // We always want to subscribe to settings, but if it fails due to permissions (e.g. on logout)
    // the error handler in subscribeToSettings will handle it and return default settings.
    unsubscribe = subscribeToSettings((newSettings) => {
      setSettings(newSettings);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const isActive = settings?.subscription.status === 'active';

  // The /dev panel is always accessible and ignores the subscription state
  const isDevRoute = pathname.startsWith('/dev');

  return (
    <SubscriptionContext.Provider value={{ settings, isActive, isLoading }}>
      {isLoading ? (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {children}
        </>
      )}
    </SubscriptionContext.Provider>
  );
}
