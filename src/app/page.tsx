'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientPage from './ClientPage';

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in (using dummy state from localStorage)
    const isAuthenticated = localStorage.getItem('isAuthenticated');

    if (isAuthenticated !== 'true') {
      // If not logged in, redirect to login page
      router.push('/login');
    }
  }, [router]);

  // If logged in, render the actual dashboard content
  // You might want to add a loading state here while checking auth
  if (typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true') {
    return <ClientPage />;
  }

  // Optionally render a loading or redirecting message
  return <div>Redirecting to login...</div>;
}
