import { useState } from 'react';
import { getPackageDetails } from '@/app/apiService'; // Import the new API function

export default function PaketTable({ data }) {
  const statusColors = {
    'Sesuai': 'bg-emerald-500',
    'Dibth Flnxnnm': 'bg-amber-500',
    'Hrge Esak Btorch': 'bg-rose-500'
  };
  
  const formatStatusLabel = (status) => {
    if (status === 'Sesuai') return 'Sesuai';
    if (status === 'Dibth Flnxnnm') return 'Dibatalkan';
    if (status === 'Hrge Esak Btorch') return 'Terlambat';
    return status;
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const handleRowClick = async (item) => {
    if (!item.id) {
      console.error("Item ID is missing for fetching details.");
      return;
    }

    setIsLoadingDetails(true);
    setDetailsError(null);
    setSelectedItemDetails(null);
    setIsModalOpen(true); // Open modal immediately with loading state

    try {
      const details = await getPackageDetails(item.id);
      setSelectedItemDetails(details);
    } catch (error) {
      console.error("Error fetching package details:", error);
      setDetailsError("Gagal memuat detail paket.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItemDetails(null);
    setDetailsError(null);
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Paket</th>
            {/* Removed Satuan header */}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jadwal</th>
            {/* Removed Pagu header */}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wilayah</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length > 0 ? (
            data.map((row) => (
              <tr
                key={row.no}
                className="hover:bg-gray-50 cursor-pointer" // Added cursor-pointer for visual cue
                onClick={() => {
                  console.log("Clicked item:", row); // Log the item
                  handleRowClick(row); // Call the original handler
                }}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.no}</td><td className="px-6 py-4 text-sm font-medium text-gray-900">{row.nama}</td>{/* Removed Satuan data cell */}<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.krema}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.jadwal}</td>{/* Removed Pagu data cell */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.wilayah}</td><td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[row.status] || 'bg-gray-100'} text-white`}>
                    {formatStatusLabel(row.status)}
                  </span>
                </td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.keterangan}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-gray-500"> {/* Decreased colspan */}
                Tidak ada data yang ditemukan
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-filter backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex justify-center items-center"> {/* Added backdrop-filter and backdrop-blur-sm */}
          <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Detail Paket</h3>
              <div className="mt-2 px-7 py-3">
                {isLoadingDetails && <p>Memuat detail...</p>}
                {detailsError && <p className="text-red-500">{detailsError}</p>}
                {selectedItemDetails && (
                  <div className="text-left text-sm text-gray-600 space-y-2">
                    <p><strong>ID:</strong> {selectedItemDetails.id}</p>
                    <p><strong>Nama Paket:</strong> {selectedItemDetails.paket}</p>
                    <p><strong>Pagu:</strong> {selectedItemDetails.pagu ? selectedItemDetails.pagu.toLocaleString('id-ID') : '-'}</p>
                    <p><strong>Satuan Kerja:</strong> {selectedItemDetails.satuan_kerja}</p>
                    <p><strong>Metode:</strong> {selectedItemDetails.metode}</p>
                    <p><strong>Jenis Pengadaan:</strong> {selectedItemDetails.jenis_pengadaan}</p>
                    <p><strong>Jadwal Pemilihan:</strong> {selectedItemDetails.pemilihan}</p>
                    <p><strong>Sumber Dana:</strong> {selectedItemDetails.sumber_dana}</p>
                    <p><strong>KLDI:</strong> {selectedItemDetails.kldi}</p>
                    <p><strong>Lokasi:</strong> {selectedItemDetails.lokasi}</p>
                    <p><strong>Provinsi:</strong> {selectedItemDetails.provinsi}</p>
                    <p><strong>Kota/Kab:</strong> {selectedItemDetails.kota_kab}</p>
                    <p><strong>Daerah Tingkat:</strong> {selectedItemDetails.daerah_tingkat}</p>
                    <p><strong>Is PDN:</strong> {selectedItemDetails.is_pdn ? 'Ya' : 'Tidak'}</p>
                    <p><strong>Is UMK:</strong> {selectedItemDetails.is_umk ? 'Ya' : 'Tidak'}</p>
                    {/* Add more fields as needed */}
                  </div>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <button
                  id="ok-btn"
                  className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={closeModal}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}