import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function DashboardHeader() {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      };
      const formattedDateTime = now.toLocaleDateString('id-ID', options);
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime(); // Set initial date and time
    const intervalId = setInterval(updateDateTime, 60000); // Update every minute

    return () => clearInterval(intervalId); // Clean up interval on component unmount
  }, []);

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
          <Image
            src="/logo_uzone.jpg"
            alt="Uzone Single Logo"
            width={40}
            height={40}
            className="rounded-full"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Uzone Business OSINT</h1>
      </div>
      <div className="text-sm text-gray-500">
        Terakhir diperbarui: {currentDateTime}
      </div>
    </div>
  );
}