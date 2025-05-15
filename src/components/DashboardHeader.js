import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardHeader() {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const router = useRouter();
  const userName = 'Admin'; // Dummy user name for now

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

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn'); // Clear dummy auth state
    router.push('/login'); // Redirect to login page
  };

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
      <div className="flex items-center gap-4"> {/* Container for date/time, user info, and logout */}
        <div className="text-sm text-gray-500">
          Terakhir diperbarui: {currentDateTime}
        </div>
        <div className="flex items-center gap-2"> {/* User info (avatar and name) */}
          {/* Placeholder Avatar */}
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {userName.charAt(0)}
          </div>
          <span className="text-gray-800 font-medium">{userName}</span>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Logout
        </button>
      </div>
    </div>
  );
}