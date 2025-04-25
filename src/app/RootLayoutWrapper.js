'use client'

import { Suspense, useState, useEffect } from 'react';
import { DataProvider } from '@/app/context/DataContext';

// Root Layout Wrapper with loading skeleton
export default function RootLayoutWrapper({ children }) {
  const [isClient, setIsClient] = useState(false);

  // Ensure we only run client-side code after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fallback skeleton for the entire app while loading
  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="h-8 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-40"></div>
          </div>
          
          {/* Card skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-4 h-24"></div>
            ))}
          </div>
          
          {/* Filter bar skeleton */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6 h-32"></div>
          
          {/* Charts skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-100 rounded-lg p-4 h-64"></div>
            <div className="bg-gray-100 rounded-lg p-4 h-64"></div>
          </div>
          
          {/* Table skeleton */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6 h-96"></div>
        </div>
      </div>
    );
  }

  // Wrap the application with DataProvider for centralized state management
  return (
    <DataProvider>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }>
        {children}
      </Suspense>
    </DataProvider>
  );
}