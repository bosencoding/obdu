import Link from 'next/link';

export default function DashboardFooter() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 mt-8">
      <div className="mb-4 md:mb-0">© 2025 Uzone Business Development</div>
      <div className="flex gap-4">
        <Link href="/bantuan" className="hover:text-gray-900">
          Bantuan
        </Link>
        <Link href="/privacy" className="hover:text-gray-900">
          Kebijakan Privasi
        </Link>
        <Link href="/terms" className="hover:text-gray-900">
          Syarat & Ketentuan
        </Link>
      </div>
    </div>
  );
}
