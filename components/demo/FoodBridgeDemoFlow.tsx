'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronRight,
  MapPin,
  Users,
  FileCheck,
  Zap,
  Check,
  AlertCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';

type DemoStep = 'intro' | 'volunteer_tracking' | 'kyc_verification' | 'mission_assignment' | 'redistribution' | 'results';

interface DemoScenario {
  title: string;
  description: string;
  icon: React.ReactNode;
  system: DemoStep;
  metrics: Record<string, string | number>;
}

export function FoodBridgeDemoFlow() {
  const [currentStep, setCurrentStep] = useState<DemoStep>('intro');
  const [completedSteps, setCompletedSteps] = useState<DemoStep[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const scenarios: Record<DemoStep, DemoScenario> = {
    intro: {
      title: 'Welcome to FOODBRIDGE',
      description: 'A complete end-to-end demonstration of our AI-powered food redistribution platform',
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      system: 'intro',
      metrics: {},
    },
    volunteer_tracking: {
      title: 'Real-Time Volunteer Tracking',
      description: 'Track volunteer locations, journeys, and performance metrics in real-time',
      icon: <MapPin className="w-8 h-8 text-blue-500" />,
      system: 'volunteer_tracking',
      metrics: {
        'Active Volunteers': 12,
        'Journeys In Progress': 8,
        'Average Speed': '18 km/h',
        'Total Distance Today': '245 km',
      },
    },
    kyc_verification: {
      title: 'KYC Verification System',
      description: 'Automated beneficiary verification with multi-document support',
      icon: <FileCheck className="w-8 h-8 text-green-500" />,
      system: 'kyc_verification',
      metrics: {
        'Pending Reviews': 15,
        'Approved Today': 23,
        'Average Score': 78,
        'Verification Rate': '92%',
      },
    },
    mission_assignment: {
      title: 'Intelligent Mission Assignment',
      description: 'Multi-factor algorithm assigns missions to optimal volunteers',
      icon: <Users className="w-8 h-8 text-purple-500" />,
      system: 'mission_assignment',
      metrics: {
        'Missions Assigned': 34,
        'Average Matching Score': 82,
        'Acceptance Rate': '94%',
        'Average ETA': '12 mins',
      },
    },
    redistribution: {
      title: 'Food Redistribution Optimization',
      description: 'Intelligent allocation ensuring fairness and maximum impact',
      icon: <TrendingUp className="w-8 h-8 text-orange-500" />,
      system: 'redistribution',
      metrics: {
        'Donations Processed': 156,
        'NGOs Served': 18,
        'Meals Distributed': 3240,
        'Avg Efficiency': 0.87,
      },
    },
    results: {
      title: 'Impact Summary',
      description: 'See the combined results of all systems working together',
      icon: <Check className="w-8 h-8 text-emerald-500" />,
      system: 'results',
      metrics: {
        'People Served': '3,240',
        'Avg Travel Distance': '8.5 km',
        'System Efficiency': '87%',
        'Cost Savings': '₹45,600',
      },
    },
  };

  const handleNext = async () => {
    setIsAnimating(true);
    const steps: DemoStep[] = ['intro', 'volunteer_tracking', 'kyc_verification', 'mission_assignment', 'redistribution', 'results'];
    const currentIndex = steps.indexOf(currentStep);

    setTimeout(() => {
      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        setCurrentStep(nextStep);
        setCompletedSteps([...completedSteps, currentStep]);
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleReset = () => {
    setCurrentStep('intro');
    setCompletedSteps([]);
    setIsAnimating(false);
  };

  const scenario = scenarios[currentStep];
  const allSteps: DemoStep[] = ['intro', 'volunteer_tracking', 'kyc_verification', 'mission_assignment', 'redistribution', 'results'];
  const progress = ((allSteps.indexOf(currentStep) + 1) / allSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">FOODBRIDGE Demo</h1>
          <p className="text-slate-600">End-to-End System Walkthrough</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-slate-700">Progress</span>
            <span className="text-sm font-semibold text-slate-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center">
            {allSteps.map((step, index) => (
              <React.Fragment key={step}>
                <button
                  onClick={() => {
                    if (completedSteps.includes(step) || step === 'intro') {
                      setCurrentStep(step);
                    }
                  }}
                  disabled={!completedSteps.includes(step) && step !== 'intro' && step !== currentStep}
                  className={`flex flex-col items-center gap-2 ${
                    step === currentStep
                      ? 'opacity-100'
                      : completedSteps.includes(step)
                      ? 'opacity-100 cursor-pointer'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold transition-all ${
                      step === currentStep
                        ? 'bg-blue-500 ring-4 ring-blue-200'
                        : completedSteps.includes(step)
                        ? 'bg-green-500'
                        : 'bg-slate-300'
                    }`}
                  >
                    {completedSteps.includes(step) ? <Check className="w-5 h-5" /> : index + 1}
                  </div>
                  <span className="text-xs text-slate-600 text-center max-w-[60px]">
                    {step.replace(/_/g, ' ').split(' ')[0]}
                  </span>
                </button>
                {index < allSteps.length - 1 && <div className="flex-1 h-0.5 bg-slate-200 mx-2" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
          <Card className="mb-8 overflow-hidden border-0 shadow-lg">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-8 text-white">
              <div className="flex items-center gap-4 mb-4">
                {scenario.icon}
                <div>
                  <h2 className="text-3xl font-bold">{scenario.title}</h2>
                </div>
              </div>
              <p className="text-slate-300 text-lg">{scenario.description}</p>
            </div>

            {/* Content Section */}
            <div className="p-8">
              {currentStep === 'intro' && <IntroSection />}
              {currentStep === 'volunteer_tracking' && <VolunteerTrackingSection />}
              {currentStep === 'kyc_verification' && <KycVerificationSection />}
              {currentStep === 'mission_assignment' && <MissionAssignmentSection />}
              {currentStep === 'redistribution' && <RedistributionSection />}
              {currentStep === 'results' && <ResultsSection />}
            </div>

            {/* Metrics Section */}
            {currentStep !== 'intro' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-8 py-6 bg-slate-50 border-t">
                {Object.entries(scenario.metrics).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{value}</div>
                    <div className="text-xs text-slate-600">{key}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={handleReset}
              variant="outline"
              className="px-8 py-2 h-12"
            >
              Reset Demo
            </Button>
            {currentStep !== 'results' && (
              <Button
                onClick={handleNext}
                disabled={isAnimating}
                className="px-8 py-2 h-12 bg-blue-600 hover:bg-blue-700"
              >
                {isAnimating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Next Step
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
            {currentStep === 'results' && (
              <Button
                onClick={handleReset}
                className="px-8 py-2 h-12 bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Complete Demo
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Section Components

function IntroSection() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">What We'll Learn</h3>
        <ul className="space-y-2 text-slate-700">
          <li className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <span>How volunteer locations are tracked in real-time</span>
          </li>
          <li className="flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Automated KYC verification with multi-document support</span>
          </li>
          <li className="flex items-start gap-3">
            <Users className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <span>Intelligent mission assignment using multi-factor scoring</span>
          </li>
          <li className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <span>Optimized food redistribution for maximum fairness and impact</span>
          </li>
        </ul>
      </div>

      <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">Demo Flow</h3>
        <p className="text-slate-700 mb-4">
          This interactive walkthrough simulates a real day of FOODBRIDGE operations, showing how all systems
          work together to efficiently redistribute food and support vulnerable populations.
        </p>
        <p className="text-slate-600 text-sm">
          Click "Next Step" to proceed through each component of the platform.
        </p>
      </div>
    </div>
  );
}

function VolunteerTrackingSection() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">📍 Real-Time Location Tracking</h3>
        <p className="text-slate-700 mb-4">
          The system continuously records volunteer locations, creating journey histories for each mission.
        </p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>✓ GPS points recorded every 5-10 seconds</li>
          <li>✓ Journey waypoints tracked with distance calculations</li>
          <li>✓ Movement status detection (idle, in_transit, moving_slowly)</li>
          <li>✓ Geofencing alerts for mission boundaries</li>
          <li>✓ Performance metrics (speed, distance, duration)</li>
        </ul>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-slate-50">
          <h4 className="font-semibold text-slate-900 mb-3">Volunteer: Rajesh</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Current Status:</span>
              <Badge variant="default" className="bg-blue-500">In Transit</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Distance Traveled:</span>
              <span className="font-semibold">12.5 km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Current Speed:</span>
              <span className="font-semibold">22 km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">ETA to Next:</span>
              <span className="font-semibold">8 minutes</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-50">
          <h4 className="font-semibold text-slate-900 mb-3">Journey Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Missions Completed:</span>
              <span className="font-semibold">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">People Served:</span>
              <span className="font-semibold">156</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Avg Completion Time:</span>
              <span className="font-semibold">34 mins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Rating:</span>
              <span className="font-semibold">4.8/5 ⭐</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-green-900">
          Real-time location tracking enables fair volunteer assignment and helps optimize routes for maximum efficiency.
        </p>
      </div>
    </div>
  );
}

function KycVerificationSection() {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 mb-3">✓ Beneficiary Verification</h3>
        <p className="text-slate-700 mb-4">
          Automated KYC with multi-document support ensures fair distribution and compliance.
        </p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>✓ Multi-document support (Aadhar, Voter ID, PAN, License, etc.)</li>
          <li>✓ Automated verification scoring (0-100)</li>
          <li>✓ Review workflow for borderline cases</li>
          <li>✓ 365-day auto-renewal cycle</li>
          <li>✓ Complete audit trail for compliance</li>
        </ul>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-slate-50">
          <h4 className="font-semibold text-slate-900 mb-3">Verification Example: Priya Sharma</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Verification Score:</span>
                <span className="font-semibold">82/100</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '82%' }} />
              </div>
            </div>
            <div className="text-sm">
              <span className="text-slate-600">Status: </span>
              <Badge variant="default" className="bg-green-500">Approved</Badge>
            </div>
            <div className="text-sm space-y-1">
              <div className="text-slate-600">Documents Verified:</div>
              <div className="pl-2 text-slate-700">
                <div>• Aadhar ✓</div>
                <div>• Voter ID ✓</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-50">
          <h4 className="font-semibold text-slate-900 mb-3">KYC Pipeline Today</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Pending Review:</span>
              <span className="font-semibold text-orange-600">15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Approved:</span>
              <span className="font-semibold text-green-600">23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Rejected:</span>
              <span className="font-semibold text-red-600">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Avg Time:</span>
              <span className="font-semibold">12 minutes</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-green-900">
          Automated verification accelerates the process while maintaining strict compliance standards.
        </p>
      </div>
    </div>
  );
}

function MissionAssignmentSection() {
  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="font-semibold text-purple-900 mb-3">👥 Smart Mission Assignment</h3>
        <p className="text-slate-700 mb-4">
          Multi-factor algorithm matches missions to optimal volunteers in real-time.
        </p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>✓ Distance optimization (closest volunteer)</li>
          <li>✓ Availability analysis (current workload)</li>
          <li>✓ Performance scoring (historical metrics)</li>
          <li>✓ Priority matching (mission requirements)</li>
          <li>✓ Urgency consideration (time-sensitive tasks)</li>
        </ul>
      </div>

      <Card className="p-6 bg-slate-50">
        <h4 className="font-semibold text-slate-900 mb-4">Mission Assignment: Food Pickup @ Annapurna Restaurant</h4>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-700">Top Candidate: Rajesh (Score: 88/100)</span>
              <Badge variant="default" className="bg-green-500">Best Match</Badge>
            </div>
            <div className="text-sm space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Distance Score:</span>
                <span className="font-semibold">24/25 (1.2 km away)</span>
              </div>
              <div className="flex justify-between">
                <span>Availability:</span>
                <span className="font-semibold">18/20 (Not busy)</span>
              </div>
              <div className="flex justify-between">
                <span>Performance:</span>
                <span className="font-semibold">23/25 (94% acceptance rate)</span>
              </div>
              <div className="flex justify-between">
                <span>Priority Match:</span>
                <span className="font-semibold">14/15 (Exact skill match)</span>
              </div>
              <div className="flex justify-between">
                <span>Urgency:</span>
                <span className="font-semibold">9/15 (Normal priority)</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm">
              <div className="font-semibold text-slate-900 mb-2">Assignment Result:</div>
              <div className="bg-white rounded p-3 border border-green-200">
                <div className="flex items-start gap-2 mb-2">
                  <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900">✓ Assigned to Rajesh</div>
                    <div className="text-sm text-slate-600">ETA: 4 minutes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
        <Check className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-purple-900">
          Intelligent matching results in 94% mission acceptance rates and optimal completion times.
        </p>
      </div>
    </div>
  );
}

function RedistributionSection() {
  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="font-semibold text-orange-900 mb-3">📊 Food Redistribution Optimization</h3>
        <p className="text-slate-700 mb-4">
          Multi-objective algorithm balances efficiency, fairness, and impact.
        </p>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>✓ Distance optimization for cost reduction</li>
          <li>✓ Capacity balancing across NGOs</li>
          <li>✓ Fairness in distribution (rotate recipients)</li>
          <li>✓ Demand-based allocation</li>
          <li>✓ Intelligent split distribution</li>
        </ul>
      </div>

      <Card className="p-6 bg-slate-50">
        <h4 className="font-semibold text-slate-900 mb-4">Donation: 280 Meals from Taj Hotel</h4>

        <div className="space-y-4">
          <div>
            <div className="font-semibold text-slate-900 mb-2">Primary Recipient (Score: 89/100)</div>
            <div className="bg-white rounded p-4 border-l-4 border-green-500">
              <div className="font-semibold text-slate-900 mb-2">Hope Foundation NGO</div>
              <div className="text-sm space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-semibold">3.2 km (90/100)</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity Available:</span>
                  <span className="font-semibold">280 meals (95/100)</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Demand:</span>
                  <span className="font-semibold">340 people waiting (85/100)</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-900">
                ✓ Receiving: 200 meals
              </div>
            </div>
          </div>

          <div>
            <div className="font-semibold text-slate-900 mb-2">Secondary Recipient (Score: 76/100)</div>
            <div className="bg-white rounded p-4 border-l-4 border-blue-500">
              <div className="font-semibold text-slate-900 mb-2">Smile Welfare Society</div>
              <div className="text-sm space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Distance:</span>
                  <span className="font-semibold">8.7 km (72/100)</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity Available:</span>
                  <span className="font-semibold">150 meals (88/100)</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Fed:</span>
                  <span className="font-semibold">28 hours ago (81/100)</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-900">
                ✓ Receiving: 80 meals (fairness split)
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded p-3 text-sm">
            <div className="font-semibold text-orange-900 mb-2">📈 Efficiency Metrics</div>
            <div className="space-y-1 text-orange-800">
              <div className="flex justify-between">
                <span>Total Meals Distributed:</span>
                <span className="font-semibold">280</span>
              </div>
              <div className="flex justify-between">
                <span>Overall Efficiency:</span>
                <span className="font-semibold">87%</span>
              </div>
              <div className="flex justify-between">
                <span>Average Distance:</span>
                <span className="font-semibold">5.95 km</span>
              </div>
              <div className="flex justify-between">
                <span>Fairness Score:</span>
                <span className="font-semibold">91%</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
        <Check className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-orange-900">
          Smart redistribution balances efficiency with fairness, ensuring no organization is left behind.
        </p>
      </div>
    </div>
  );
}

function ResultsSection() {
  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
        <h3 className="font-semibold text-emerald-900 mb-3">✓ End-to-End Impact Summary</h3>
        <p className="text-slate-700">
          Here's how all systems working together create meaningful impact.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">🎯 Operational Metrics</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Volunteers Tracked:</span>
              <span className="font-semibold">12 active</span>
            </div>
            <div className="flex justify-between">
              <span>Missions Completed:</span>
              <span className="font-semibold">34</span>
            </div>
            <div className="flex justify-between">
              <span>Donations Processed:</span>
              <span className="font-semibold">156</span>
            </div>
            <div className="flex justify-between">
              <span>NGOs Served:</span>
              <span className="font-semibold">18</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <h4 className="font-semibold text-green-900 mb-3">✓ KYC Verification</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Verified Today:</span>
              <span className="font-semibold">23</span>
            </div>
            <div className="flex justify-between">
              <span>Verification Rate:</span>
              <span className="font-semibold">92%</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Processing:</span>
              <span className="font-semibold">12 mins</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Review:</span>
              <span className="font-semibold">15</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-3">👥 Assignment Quality</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Avg Match Score:</span>
              <span className="font-semibold">82/100</span>
            </div>
            <div className="flex justify-between">
              <span>Acceptance Rate:</span>
              <span className="font-semibold">94%</span>
            </div>
            <div className="flex justify-between">
              <span>Avg ETA:</span>
              <span className="font-semibold">12 mins</span>
            </div>
            <div className="flex justify-between">
              <span>Completion Rate:</span>
              <span className="font-semibold">98%</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <h4 className="font-semibold text-orange-900 mb-3">📊 Distribution Impact</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Meals Distributed:</span>
              <span className="font-semibold">3,240</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Efficiency:</span>
              <span className="font-semibold">87%</span>
            </div>
            <div className="flex justify-between">
              <span>Fairness Score:</span>
              <span className="font-semibold">89%</span>
            </div>
            <div className="flex justify-between">
              <span>Cost Savings:</span>
              <span className="font-semibold">₹45.6K</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 bg-emerald-50 border-emerald-200">
        <h4 className="font-semibold text-emerald-900 mb-4">🌟 Key Takeaways</h4>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-emerald-900">3,240 people served</div>
              <div className="text-sm text-emerald-800">Through intelligent coordination</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-emerald-900">87% operational efficiency</div>
              <div className="text-sm text-emerald-800">Optimized routes and assignments</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-emerald-900">94% volunteer satisfaction</div>
              <div className="text-sm text-emerald-800">Fair and intelligent assignments</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold text-emerald-900">₹45.6K cost savings</div>
              <div className="text-sm text-emerald-800">Through efficient distribution</div>
            </div>
          </li>
        </ul>
      </Card>
    </div>
  );
}
