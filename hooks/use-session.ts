'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useSessionUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const supabase = createClient();

    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      setUserId(session?.user?.id ?? null);
    };

    load().catch((error) => {
      console.error('Error loading session:', error);
    });

    const auth = supabase.auth as unknown as {
      onAuthStateChange?: (cb: (event: string) => void) => { data: { subscription: { unsubscribe: () => void } } };
    };

    const subscription = auth.onAuthStateChange
      ? auth.onAuthStateChange(() => {
          load().catch((error) => {
            console.error('Error refreshing session:', error);
          });
        })
      : null;

    const handleFocus = () => {
      load().catch((error) => {
        console.error('Error refreshing session on focus:', error);
      });
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      active = false;
      window.removeEventListener('focus', handleFocus);
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  return userId;
}
