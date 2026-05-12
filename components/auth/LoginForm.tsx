'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserRoleOrFallback } from '@/lib/supabase/user-profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const DEMO_ACCOUNTS = [
  { label: 'Donor', email: 'donor@foodbridge.local' },
  { label: 'Reporter', email: 'reporter@foodbridge.local' },
  { label: 'NGO', email: 'ngo@foodbridge.local' },
  { label: 'Volunteer', email: 'volunteer@foodbridge.local' },
] as const;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const authError = new URLSearchParams(window.location.search).get('error');
    if (authError) {
      setError(authError);
    }
  }, []);

  const getSafeNextPath = () => {
    if (typeof window === 'undefined') {
      return '/';
    }

    const nextParam = new URLSearchParams(window.location.search).get('next');
    return nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';
  };

  const applyDemoAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('Password123!');
    setRememberMe(true);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        rememberMe,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Get user role to redirect to correct dashboard
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const nextPath = getSafeNextPath();
        const role = await getUserRoleOrFallback(supabase, session.user);

        if (nextPath !== '/') {
          router.replace(nextPath);
        } else if (role) {
          router.replace(`/${role}`);
        } else {
          router.replace('/onboarding');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center px-4 py-8">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-200/30 to-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10">
        <Card className="overflow-hidden border border-white/80 bg-white/95 shadow-2xl backdrop-blur-xl">
          {/* Header gradient bar */}
          <div className="h-1 bg-gradient-to-r from-green-500 via-blue-500 to-cyan-500"></div>

          <div className="p-8">
            {/* Logo & Title */}
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full blur-lg"></div>
                  <Image
                    src="/logo.png"
                    alt="FoodBridge Logo"
                    fill
                    sizes="64px"
                    className="object-contain relative z-10"
                    priority
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-1">
                <span className="bg-gradient-to-r from-green-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  FoodBridge
                </span>
              </h1>
              <p className="text-sm text-slate-600 font-medium">Secure Access to Your Account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Error Alert */}
              {error && (
                <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50/80 p-3.5 animate-slide-up">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  required
                  className="w-full bg-slate-50/50 border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:ring-blue-500/10 transition-colors"
                />
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-900">
                    Password
                  </label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                    className="w-full pr-10 bg-slate-50/50 border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:ring-blue-500/10 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    suppressHydrationWarning
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 py-2.5 font-semibold text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Log In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-xs text-slate-500 font-medium">Or try demo</span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            {/* Demo Accounts */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-gradient-to-br from-blue-50/50 to-green-50/50 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Demo Accounts
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => applyDemoAccount(account.email)}
                    disabled={loading}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2.5 text-left text-xs transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-md disabled:opacity-50"
                  >
                    <span className="block font-semibold text-slate-900">{account.label}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">Password123!</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                Don&apos;t have an account?{' '}
                <Link 
                  href="/signup" 
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors inline-flex items-center gap-1"
                >
                  Sign up
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </p>
            </div>

            {/* Back to Home */}
            <div className="mt-4 text-center">
              <Link 
                href="/" 
                className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </Card>

        {/* Footer text */}
        <p className="mt-6 text-center text-xs text-slate-600">
          © 2026 FOODBRIDGE. All rights reserved.
        </p>
      </div>
    </div>
  );
}
