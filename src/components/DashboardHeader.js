import Image from 'next/image';

export default function DashboardHeader() {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
          <Image 
            src="/logo-bogor.png" 
            alt="Logo Kota Bogor" 
            width={40} 
            height={40}
            className="rounded-full"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Uzone Business OSINT</h1>
      </div>
      <div className="text-sm text-gray-500">
        Terakhir diperbarui: 17 April 2025 09:00
      </div>
    </div>
  );
}