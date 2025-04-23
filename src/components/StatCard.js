export default function StatCard({ icon, title, value, isLoading }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        {icon}
        <span className="text-sm">{title}</span>
      </div>
      {isLoading ? (
        <div className="h-8 flex items-center">
          <div className="w-16 h-5 bg-gray-200 animate-pulse rounded"></div>
        </div>
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </div>
  );
}