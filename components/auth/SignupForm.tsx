'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, AlertCircle, Gift, Clipboard, Building2, MapPin, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/lib/types';

type SignupStep = 'info' | 'role' | 'kyc';
type KycIdType = 'national_id' | 'passport' | 'drivers_license' | 'voter_id';

type KycData = {
  phone: string;
  addressLine1: string;
  city: string;
  stateOrProvince: string;
  country: string;
  idType: KycIdType;
  idNumber: string;
  organizationName: string;
  registrationNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  coverageArea: string;
  consentAccepted: boolean;
};

const ROLES: { value: UserRole; label: string; description: string; icon: ReactNode }[] = [
  {
    value: 'donor',
    label: 'Donor',
    description: 'Share excess food',
    icon: <Gift className="w-6 h-6" />,
  },
  {
    value: 'reporter',
    label: 'Reporter',
    description: 'Report food needs',
    icon: <Clipboard className="w-6 h-6" />,
  },
  {
    value: 'ngo',
    label: 'NGO',
    description: 'Manage operations',
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    value: 'volunteer',
    label: 'Volunteer',
    description: 'Deliver food',
    icon: <MapPin className="w-6 h-6" />,
  },
];

const STEP_LABELS: Record<SignupStep, string> = {
  info: '1. Account Info',
  role: '2. Choose Role',
  kyc: '3. KYC Verification',
};

const DEFAULT_KYC: KycData = {
  phone: '',
  addressLine1: '',
  city: '',
  stateOrProvince: '',
  country: '',
  idType: 'national_id',
  idNumber: '',
  organizationName: '',
  registrationNumber: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  coverageArea: '',
  consentAccepted: false,
};

function validateKyc(role: UserRole, kyc: KycData): string | null {
  if (!kyc.phone.trim()) return 'Phone number is required for KYC.';
  if (!kyc.addressLine1.trim()) return 'Address is required for KYC.';
  if (!kyc.city.trim()) return 'City is required for KYC.';
  if (!kyc.country.trim()) return 'Country is required for KYC.';
  if (!kyc.idNumber.trim()) return 'Government ID number is required for KYC.';
  if (!kyc.consentAccepted) return 'You must accept KYC verification consent.';

  if (role === 'ngo') {
    if (!kyc.organizationName.trim()) return 'Organization name is required for NGO accounts.';
    if (!kyc.registrationNumber.trim()) return 'Registration number is required for NGO accounts.';
  }

  if (role === 'volunteer') {
    if (!kyc.emergencyContactName.trim()) return 'Emergency contact name is required for volunteer accounts.';
    if (!kyc.emergencyContactPhone.trim()) return 'Emergency contact phone is required for volunteer accounts.';
  }

  if (role === 'reporter') {
    if (!kyc.coverageArea.trim()) return 'Coverage area is required for reporter accounts.';
  }

  return null;
}

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>('info');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [kyc, setKyc] = useState<KycData>(DEFAULT_KYC);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setStep('role');
  };

  const handleRoleContinue = () => {
    if (!role) {
      setError('Please select a role');
      return;
    }

    setError('');
    setStep('kyc');
  };

  const handleSignup = async () => {
    if (!role) {
      setError('Please select a role');
      return;
    }

    const validationError = validateKyc(role, kyc);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const supabase = createClient();

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
            kyc_status: 'pending',
            kyc_submitted_at: new Date().toISOString(),
            kyc,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!authData.user) {
        setError('Failed to create account');
        return;
      }

      router.replace('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 bg-white/95 text-slate-900 rounded-xl shadow-xl animate-fade-in backdrop-blur-sm">
      <div className="text-center mb-8">
        <div className="mx-auto mb-6 flex justify-center">
          <div className="relative w-20 h-20">
            <Image
              src="/logo.png"
              alt="FoodBridge Logo"
              fill
              sizes="80px"
              className="object-contain"
              priority
            />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-700 to-blue-700 bg-clip-text text-transparent mb-2">FoodBridge</h1>

        <div className="flex items-center justify-center gap-2 mb-6">
          {(['info', 'role', 'kyc'] as SignupStep[]).map((s, index) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`text-sm font-medium ${step === s ? 'text-green-700' : 'text-slate-500'}`}>
                {STEP_LABELS[s]}
              </div>
              {index < 2 && <div className="w-4 h-0.5 bg-border" />}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg animate-slide-up mb-6">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {step === 'info' && (
        <form onSubmit={handleInfoSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Full Name</label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              disabled={loading}
              required
              className="w-full border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              required
              className="w-full border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                className="w-full pr-10 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Confirm Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                required
                className="w-full pr-10 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md">
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      )}

      {step === 'role' && (
        <div className="space-y-5">
          <p className="text-slate-800 text-sm font-medium mb-4">What role describes you best?</p>

          <div className="space-y-3">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`w-full p-4 rounded-lg border-2 transition-all flex items-start gap-3 text-left hover:shadow-md ${
                  role === r.value
                    ? 'border-green-600 bg-green-50 shadow-md'
                    : 'border-slate-200 hover:border-green-300'
                }`}
              >
                <div className={`mt-1 transition-colors ${role === r.value ? 'text-green-700' : 'text-slate-500'}`}>
                  {r.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{r.label}</p>
                  <p className="text-sm text-slate-600">{r.description}</p>
                </div>
              </button>
            ))}
          </div>

          <Button type="button" onClick={handleRoleContinue} disabled={loading || !role} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold mt-6 transition-all flex items-center justify-center gap-2 shadow-md">
            Continue to KYC
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button type="button" onClick={() => setStep('info')} variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50">
            Back
          </Button>
        </div>
      )}

      {step === 'kyc' && (
        <div className="space-y-5">
          <p className="text-slate-800 text-sm font-medium">KYC is required for all roles before account activation.</p>

          <Input placeholder="Phone Number" value={kyc.phone} onChange={(e) => setKyc((prev) => ({ ...prev, phone: e.target.value }))} disabled={loading} required className="border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20" />
          <Input placeholder="Address Line 1" value={kyc.addressLine1} onChange={(e) => setKyc((prev) => ({ ...prev, addressLine1: e.target.value }))} disabled={loading} required className="border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="City" value={kyc.city} onChange={(e) => setKyc((prev) => ({ ...prev, city: e.target.value }))} disabled={loading} required className="border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20" />
            <Input placeholder="State / Province" value={kyc.stateOrProvince} onChange={(e) => setKyc((prev) => ({ ...prev, stateOrProvince: e.target.value }))} disabled={loading} className="border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20" />
          </div>

          <Input placeholder="Country" value={kyc.country} onChange={(e) => setKyc((prev) => ({ ...prev, country: e.target.value }))} disabled={loading} required className="border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label id="kyc-id-type-label" htmlFor="kyc-id-type" className="sr-only">Government ID Type</label>
              <select
                id="kyc-id-type"
                name="kyc-id-type"
                value={kyc.idType}
                onChange={(e) => setKyc((prev) => ({ ...prev, idType: e.target.value as KycIdType }))}
                disabled={loading}
                aria-label="Government ID Type"
                aria-labelledby="kyc-id-type-label"
                title="Government ID Type"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="national_id">National ID</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver&apos;s License</option>
                <option value="voter_id">Voter ID</option>
              </select>
            </div>
            <Input placeholder="ID Number" value={kyc.idNumber} onChange={(e) => setKyc((prev) => ({ ...prev, idNumber: e.target.value }))} disabled={loading} required className="border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20" />
          </div>

          {role === 'ngo' && (
            <>
              <Input placeholder="Organization Name" value={kyc.organizationName} onChange={(e) => setKyc((prev) => ({ ...prev, organizationName: e.target.value }))} disabled={loading} required className="border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20" />
              <Input placeholder="Organization Registration Number" value={kyc.registrationNumber} onChange={(e) => setKyc((prev) => ({ ...prev, registrationNumber: e.target.value }))} disabled={loading} required className="border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20" />
            </>
          )}

          {role === 'volunteer' && (
            <>
              <Input placeholder="Emergency Contact Name" value={kyc.emergencyContactName} onChange={(e) => setKyc((prev) => ({ ...prev, emergencyContactName: e.target.value }))} disabled={loading} required className="border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20" />
              <Input placeholder="Emergency Contact Phone" value={kyc.emergencyContactPhone} onChange={(e) => setKyc((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))} disabled={loading} required className="border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20" />
            </>
          )}

          {role === 'reporter' && (
            <Input placeholder="Coverage Area" value={kyc.coverageArea} onChange={(e) => setKyc((prev) => ({ ...prev, coverageArea: e.target.value }))} disabled={loading} required className="border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20" />
          )}

          <label className="flex items-start gap-2 text-sm text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={kyc.consentAccepted}
              onChange={(e) => setKyc((prev) => ({ ...prev, consentAccepted: e.target.checked }))}
              disabled={loading}
              className="mt-1 w-4 h-4 rounded border-slate-300 accent-green-600"
            />
            I consent to identity verification and confirm all submitted KYC details are accurate.
          </label>

          <Button type="button" onClick={handleSignup} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold mt-6 transition-all flex items-center justify-center gap-2 shadow-md">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Submit KYC & Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <Button type="button" onClick={() => setStep('role')} variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50">
            Back
          </Button>
        </div>
      )}

      <p className="text-center mt-8 text-slate-700">
        Already have an account?{' '}
        <Link href="/login" className="text-green-700 hover:text-green-800 font-semibold transition-colors">
          Log in
        </Link>
      </p>
    </Card>
  );
}
