'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRight, Heart, ClipboardCheck, Users, MapPin } from 'lucide-react';

const ONBOARDING_SLIDES = {
  donor: [
    {
      title: 'Turn Excess into Access',
      description: 'Your extra food directly supports nearby homeless neighbors in real-time',
      icon: <Heart className="w-16 h-16 text-red-500" />,
    },
    {
      title: 'Be a Community Hero',
      description: 'Track your impact and see how many meals you&apos;ve provided',
      icon: <Users className="w-16 h-16 text-yellow-500" />,
    },
    {
      title: 'Simple & Secure',
      description: 'Just post what you have available - we handle the rest',
      icon: <ClipboardCheck className="w-16 h-16 text-green-500" />,
    },
  ],
  reporter: [
    {
      title: 'Report Food Needs',
      description: 'Help us understand where food is needed most in your community',
      icon: <ClipboardCheck className="w-16 h-16 text-blue-500" />,
    },
    {
      title: 'Verify Cases',
      description: 'Ensure reports are accurate and help prioritize urgent needs',
      icon: <MapPin className="w-16 h-16 text-red-500" />,
    },
  ],
  ngo: [
    {
      title: 'Command Center',
      description: 'Manage all food distribution operations from one dashboard',
      icon: <Users className="w-16 h-16 text-green-600" />,
    },
    {
      title: 'Real-time Coordination',
      description: 'Track donations, cases, and volunteer missions in real-time',
      icon: <MapPin className="w-16 h-16 text-blue-500" />,
    },
  ],
  volunteer: [
    {
      title: 'Accept Missions',
      description: 'Pick up food from donors and deliver to those in need',
      icon: <MapPin className="w-16 h-16 text-green-500" />,
    },
    {
      title: 'Make a Difference',
      description: 'Every delivery brings hope and sustenance to your neighbors',
      icon: <Heart className="w-16 h-16 text-red-500" />,
    },
  ],
};

export function OnboardingCarousel({ userRole }: { userRole: string }) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);

  const slides = ONBOARDING_SLIDES[userRole as keyof typeof ONBOARDING_SLIDES] || ONBOARDING_SLIDES.donor;
  const totalSlides = slides.length;
  const isLastSlide = currentSlide === totalSlides - 1;

  const getSafeRolePath = (role: string) => {
    if (role === 'donor' || role === 'reporter' || role === 'ngo' || role === 'volunteer') {
      return `/${role}`;
    }

    return '/onboarding';
  };

  const handleNext = () => {
    if (isLastSlide) {
      handleComplete();
    } else {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        router.push(getSafeRolePath(userRole));
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const slide = slides[currentSlide];

  return (
    <Card className="p-8 bg-white rounded-lg shadow-lg text-center">
      <div className="mb-8 flex justify-center">
        {slide.icon}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-4">{slide.title}</h2>
      <p className="text-gray-600 mb-8">{slide.description}</p>

      {/* Progress dots */}
      <div className="flex gap-2 justify-center mb-8">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-green-600 w-6' : 'bg-gray-300 w-2'
            }`}
          />
        ))}
      </div>

      <Button
        onClick={handleNext}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
      >
        {isLastSlide ? 'Get Started' : 'Next'}
        {!isLastSlide && <ChevronRight className="w-4 h-4" />}
      </Button>
    </Card>
  );
}
