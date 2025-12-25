'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';

export default function Home() {
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only running client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && mounted) {
      if (!user) {
        router.push('/login');
      } else if (userProfile) {
        const dashboardUrl = userProfile.role === 'student' ? '/student' : '/instructor';
        router.push(dashboardUrl);
      }
    }
  }, [user, userProfile, loading, router, mounted]);

  // Show nothing until client-side mount completes
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg">Loading...</p>
      </div>
    </div>
  );
}
