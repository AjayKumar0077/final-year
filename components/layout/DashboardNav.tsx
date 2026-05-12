'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserProfileOrFallback } from '@/lib/supabase/user-profile';
import { Menu, LogOut, User, BarChart3 } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function DashboardNav({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const hideUserIdentity = pathname?.startsWith('/admin');

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          const profile = await getUserProfileOrFallback(supabase, session.user);
          setUser(profile);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-primary via-primary to-primary/90 backdrop-blur-md text-primary-foreground shadow-2xl z-50 border-b-2 border-white/10">
      <div className="px-4 md:px-6 py-3 flex items-center justify-between w-full">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-white/20 transition md:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition group">
            <div className="relative w-9 h-9 md:w-10 md:h-10 bg-white rounded-lg p-1 group-hover:bg-white/90 transition overflow-hidden">
              <Image 
                src="/logo.png" 
                alt="FoodBridge Logo" 
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="hidden sm:inline font-bold text-lg md:text-xl tracking-tight">FoodBridge</span>
          </Link>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          {!loading && user && !hideUserIdentity && (
            <>
              <div className="text-sm hidden md:block text-right">
                <p className="font-semibold">{user.full_name}</p>
                <p className="text-primary-foreground/70 capitalize text-xs">{user.role}</p>
              </div>

              <ThemeToggle />

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="Open user menu"
                  className="p-2.5 hover:bg-primary-foreground/20 rounded-lg transition"
                >
                  <User className="w-5 h-5" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-3 w-56 bg-card text-card-foreground rounded-xl shadow-xl py-2 z-10 border border-border animate-slide-down">
                    <Link
                      href="/profile"
                      className="block px-4 py-3 hover:bg-muted transition text-sm font-medium"
                    >
                      Profile Settings
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-3 hover:bg-muted transition text-sm font-medium flex items-center gap-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <div
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 hover:bg-destructive/10 transition text-sm font-medium text-destructive flex items-center gap-2 border-t border-border mt-1 pt-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
