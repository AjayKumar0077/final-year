/**
 * DashboardLayout Component
 * 
 * Provides the main layout structure for authenticated users
 * with navigation, sidebar, and responsive mobile support
 * 
 * @component
 * @example
 * <DashboardLayout>
 *   <YourDashboardContent />
 * </DashboardLayout>
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Menu,
  X,
  Home,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Bell,
  User,
  Zap,
  MapPin,
  Heart,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: 'admin' | 'donor' | 'volunteer' | 'ngo' | 'reporter';
  userName?: string;
}

/**
 * Navigation items available for different user roles
 */
const getNavItems = (role?: string): NavItem[] => {
  const baseItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="w-5 h-5" />,
    },
  ];

  const roleItems: Record<string, NavItem[]> = {
    admin: [
      { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="w-5 h-5" /> },
      { label: 'Users', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
      { label: 'KYC Reviews', href: '/admin/kyc', icon: <User className="w-5 h-5" /> },
    ],
    volunteer: [
      { label: 'My Missions', href: '/volunteer/missions', icon: <Zap className="w-5 h-5" /> },
      { label: 'Tracking', href: '/volunteer/tracking', icon: <MapPin className="w-5 h-5" /> },
    ],
    donor: [
      { label: 'Donations', href: '/donor/donations', icon: <Heart className="w-5 h-5" /> },
      { label: 'Impact', href: '/donor/impact', icon: <BarChart3 className="w-5 h-5" /> },
    ],
    ngo: [
      { label: 'Recipients', href: '/ngo/recipients', icon: <Users className="w-5 h-5" /> },
      { label: 'Analytics', href: '/ngo/analytics', icon: <BarChart3 className="w-5 h-5" /> },
    ],
  };

  return [...baseItems, ...(roleItems[role || ''] || [])];
};

/**
 * DashboardLayout - Main layout component for authenticated dashboard
 */
export function DashboardLayout({
  children,
  userRole = 'volunteer',
  userName = 'User',
}: DashboardLayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = getNavItems(userRole);

  const handleLogout = () => {
    // TODO: Implement actual logout logic with Supabase
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Zap className="w-6 h-6 text-blue-600" />
            <span className="hidden sm:inline bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              FOODBRIDGE
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-sm font-medium"
              >
                {item.icon}
                {item.label}
                {item.badge && (
                  <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu - Desktop */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500 capitalize">{userRole}</p>
              </div>
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
                alt={userName}
                className="w-8 h-8 rounded-full"
              />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {item.icon}
                {item.label}
                {item.badge && (
                  <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            <hr className="my-2" />
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <User className="w-5 h-5" />
              Profile
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </nav>
        )}
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-slate-200 bg-white/50 backdrop-blur-sm">
          <div className="p-6 space-y-6">
            {/* Quick Stats */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-900">Quick Stats</h3>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
                  <p className="text-xs text-slate-600">Contribution</p>
                  <p className="text-lg font-bold text-blue-600">1,250</p>
                </div>
                <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50">
                  <p className="text-xs text-slate-600">Impact</p>
                  <p className="text-lg font-bold text-green-600">625</p>
                </div>
              </div>
            </div>

            {/* Settings & Help */}
            <div className="space-y-2 pt-6 border-t border-slate-200">
              <Link
                href="/settings"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-sm"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <a
                href="#help"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors text-sm"
              >
                <Bell className="w-4 h-4" />
                Help & Support
              </a>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm text-left"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-slate-600">
          <p>© 2026 FOODBRIDGE. Turning Excess Into Access.</p>
        </div>
      </footer>
    </div>
  );
}
