'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleOrFallback } from '@/lib/supabase/user-profile';
import { OnboardingCarousel } from '@/components/auth/OnboardingCarousel';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getRole = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const role = await getUserRoleOrFallback(supabase, session.user);

        if (role) {
          setUserRole(role);
        } else {
          router.push('/signup');
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    getRole();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <>
      {userRole && <OnboardingCarousel userRole={userRole} />}
    </>
  );
}
