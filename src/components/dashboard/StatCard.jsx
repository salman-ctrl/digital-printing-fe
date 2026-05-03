import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  // Mapping warna background icon agar sesuai props 'color'
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };

  const bgClass = colorClasses[color] || 'bg-blue-500';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        
        {/* Opsional: Indikator Trend jika ada data trend */}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{Math.abs(trend)}% dari bulan lalu</span>
          </div>
        )}
      </div>
      
      <div className={`p-3 rounded-xl ${bgClass} text-white shadow-sm`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default StatCard;