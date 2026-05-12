'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
import { FoodBridgeDemoFlow } from '@/components/demo/FoodBridgeDemoFlow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ArrowRight, BarChart3, MapPin, Zap, Users } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'landing' | 'demo' | 'analytics'>('landing');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (viewMode === 'demo') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="fixed top-4 left-4 z-50">
          <Button 
            onClick={() => setViewMode('landing')}
            variant="outline"
            className="gap-2"
          >
            ← Back to Home
          </Button>
        </div>
        <FoodBridgeDemoFlow />
      </div>
    );
  }

  if (viewMode === 'analytics') {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="fixed top-4 left-4 z-50">
          <Button 
            onClick={() => setViewMode('landing')}
            variant="outline"
            className="gap-2"
          >
            ← Back to Home
          </Button>
        </div>
        <AnalyticsDashboard />
      </div>
    );
  }

  // Landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900">FOODBRIDGE</h1>
          </div>
          <Button onClick={() => router.push('/login')} variant="outline">
            Sign In
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
              AI-Powered Food Redistribution Platform
            </Badge>
            <h2 className="text-4xl sm:text-6xl font-bold text-slate-900 mb-6">
              Turn Excess Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">Access</span>
            </h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              FOODBRIDGE uses AI and geolocation to optimize food redistribution, connect volunteers efficiently, and serve those in need with real-time transparency.
            </p>
            <div className="flex gap-4 justify-center flex-col sm:flex-row">
              <Button 
                onClick={() => setViewMode('demo')}
                size="lg" 
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 gap-2"
              >
                Interactive Demo <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => setViewMode('analytics')}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                View Analytics <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-slate-900 text-center mb-12">Core Systems</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <MapPin className="w-8 h-8" />,
                title: 'Volunteer Tracking',
                desc: 'Real-time location tracking with geofencing and journey analytics'
              },
              {
                icon: <Activity className="w-8 h-8" />,
                title: 'KYC Verification',
                desc: 'Automated beneficiary verification with 0-100 scoring system'
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: 'Smart Assignment',
                desc: 'Multi-factor volunteer matching using distance, performance, and availability'
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: 'Fair Distribution',
                desc: 'Optimized food redistribution balancing efficiency and fairness'
              },
            ].map((feature, i) => (
              <Card key={i} className="p-6 hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-3">{feature.icon}</div>
                <h4 className="font-semibold text-slate-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-slate-600">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-blue-600/5 to-green-600/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '24,560', label: 'Meals Distributed' },
              { number: '12,280', label: 'People Served' },
              { number: '145', label: 'Active Volunteers' },
              { number: '₹2.85L', label: 'Cost Saved' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{stat.number}</div>
                <div className="text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <Card className="max-w-2xl mx-auto p-12 text-center bg-gradient-to-r from-blue-50 to-green-50">
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Ready to Make an Impact?</h3>
          <p className="text-slate-600 mb-6">Join our platform to volunteer, donate, or receive assistance</p>
          <div className="flex gap-4 justify-center flex-col sm:flex-row">
            <Button 
              onClick={() => router.push('/login')}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => router.push('/signup')}
              variant="outline"
            >
              Create Account
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/60 bg-white/50 backdrop-blur-xl py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-600">
          <p>© 2026 FOODBRIDGE. Turning Excess Into Access.</p>
        </div>
      </footer>
    </div>
  );
}
