'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SplashScreen } from '@/components/splash-screen';
import { AuthForm } from '@/components/auth-form';
import { authStore } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    if (authStore.isAuthenticated()) {
      setIsAuthenticated(true);
      router.push('/dashboard');
    }
  }, [router]);

  if (isAuthenticated) {
    return null;
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return <AuthForm onSuccess={() => router.push('/dashboard')} />;
}
