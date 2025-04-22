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
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Paket</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satuan</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metode</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jadwal</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wilayah</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Keterangan</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length > 0 ? (
            data.map((row) => (
              <tr key={row.no} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.no}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.nama}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.satuan}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.krema}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.jadwal}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.wilayah}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[row.status] || 'bg-gray-100'} text-white`}>
                    {formatStatusLabel(row.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.keterangan}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                Tidak ada data yang ditemukan
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}