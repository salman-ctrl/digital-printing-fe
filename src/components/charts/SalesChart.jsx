import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatRupiah } from '../../utils/formatters';
import { AlertCircle, RefreshCw, BarChart3 } from 'lucide-react';

const SalesChart = ({ data = [], title, isError, onRetry }) => {
  const formatXAxis = (tickItem) => {
    try {
      const date = new Date(tickItem);
      if (isNaN(date.getTime())) return tickItem;
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } catch (e) {
      return tickItem;
    }
  };

  return (
    <div className="bg-white p-8 h-[480px] flex flex-col relative">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{title}</h3>
      </div>

      <div className="flex-1 w-full min-h-0 relative">
        {/* State Error */}
        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-white/90 backdrop-blur-sm rounded-2xl border-2 border-dashed border-red-100">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-sm font-bold text-gray-800 uppercase tracking-tight">Gagal Memuat Data Historis</p>
            <p className="text-xs text-gray-400 mb-6">Database mungkin sedang sibuk atau data belum tersedia.</p>
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-red-600 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
            </button>
          </div>
        )}

        {/* State Kosong */}
        {!isError && data.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 text-gray-300">
            <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Menunggu Data Transaksi...</p>
          </div>
        )}

        {/* FIX: Menggunakan tinggi piksel tetap (min-h-[350px]) untuk mencegah warning width -1 */}
        <div className="w-full h-full min-h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                tickFormatter={formatXAxis}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value, name) => [formatRupiah(value), name === 'total' ? 'Pendapatan Aktual' : 'Prediksi AI']}
                labelFormatter={(label) => `Periode: ${label}`}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', padding: '15px' }}
              />
              <Legend verticalAlign="top" height={50} align="left" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }} />

              <Line
                type="monotone"
                dataKey="total"
                name="total"
                stroke="#3b82f6"
                strokeWidth={4}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, shadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="forecast"
                stroke="#ef4444"
                strokeWidth={4}
                strokeDasharray="8 8"
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SalesChart;