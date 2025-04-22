export default function StatCard({ icon, title, value }) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 text-gray-500 mb-2">
          {icon}
          <span className="text-sm">{title}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    );
  }