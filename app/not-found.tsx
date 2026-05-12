'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import Link from 'next/link';

/**
 * 404 Not Found Page
 * 
 * Displayed when a requested route doesn't exist
 */
export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Decorative Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-red-500/20 rounded-full blur-2xl"></div>
            <AlertTriangle className="w-24 h-24 text-slate-600 relative" />
          </div>
        </div>

        {/* Error Code */}
        <div className="mb-4">
          <h1 className="text-7xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent mb-2">
            404
          </h1>
          <p className="text-2xl font-bold text-slate-900">Page Not Found</p>
        </div>

        {/* Description */}
        <p className="text-slate-600 mb-8">
          We couldn't find the page you're looking for. It might have been moved or deleted.
        </p>

        {/* Suggestions */}
        <div className="bg-slate-50 rounded-lg p-4 mb-8 text-left">
          <p className="text-sm font-semibold text-slate-900 mb-2">Here's what you can do:</p>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Check the URL for typos</li>
            <li>Go back to the previous page</li>
            <li>Return to the home page</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Go Back
          </Button>
          <Link href="/">
            <Button className="gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 mt-8">
          Error Code: 404 | <Link href="/support" className="text-blue-600 hover:underline">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}
