import './globals.css'
import { Suspense } from 'react'
import RootLayoutWrapper from './RootLayoutWrapper'

export const metadata = {
  title: 'Dashboard Anggaran Kota Bogor',
  description: 'Dashboard untuk melihat detail anggaran Kota Bogor',
}

// Simple loading skeleton for the initial page load
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  )
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-gray-50">
        <Suspense fallback={<LoadingSkeleton />}>
          <RootLayoutWrapper>
            {children}
          </RootLayoutWrapper>
        </Suspense>
      </body>
    </html>
  )
}