import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { X, TrendingUp, Calendar } from 'lucide-react';

const ProductChart = ({ data = [], title = "Tren Pola Produk" }) => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [timeRange, setTimeRange] = useState('all');

  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
  ];

  // Filter waktu
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeRange === 'all') return data;

    const now = new Date();
    const cutoff = new Date();

    if (timeRange === '3m') cutoff.setMonth(now.getMonth() - 3);
    if (timeRange === '6m') cutoff.setMonth(now.getMonth() - 6);
    if (timeRange === '12m') cutoff.setFullYear(now.getFullYear() - 1);
    if (timeRange === '2y') cutoff.setFullYear(now.getFullYear() - 2);

    cutoff.setHours(0, 0, 0, 0);
    return data.filter(item => new Date(item.date) >= cutoff);
  }, [data, timeRange]);

  const productList = useMemo(() => {
    return [...new Set(data.map(item => item.product_name))]
      .filter(n => n && n !== 'Produk Unknown')
      .sort();
  }, [data]);

  useEffect(() => {
    if (productList.length > 0 && selectedProducts.length === 0) {
      setSelectedProducts(productList.slice(0, 2));
    }
  }, [productList]);

  // Agregasi per minggu (supaya titiknya per minggu seperti SalesChart)
  const chartData = useMemo(() => {
    const weekMap = {};

    filteredData.forEach(item => {
      const date = new Date(item.date);
      // Ambil Senin dari minggu tersebut sebagai key
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      const weekKey = monday.toISOString().split('T')[0];

      if (!weekMap[weekKey]) weekMap[weekKey] = { name: weekKey };
      weekMap[weekKey][item.product_name] =
        (weekMap[weekKey][item.product_name] || 0) + item.total;
    });

    return Object.values(weekMap).sort((a, b) => new Date(a.name) - new Date(b.name));
  }, [filteredData]);

  const handleSelect = (product) => {
    if (selectedProducts.includes(product)) {
      setSelectedProducts(prev => prev.filter(p => p !== product));
    } else if (selectedProducts.length < 5) {
      setSelectedProducts(prev => [...prev, product]);
    }
  };

  const hasValidData = chartData.length >= 1 && selectedProducts.length > 0;

  return (
    <div className="bg-white p-8 h-[520px] flex flex-col relative">

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter">{title}</h3>

        <div className="flex flex-wrap gap-3">
          {/* Filter waktu */}
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-blue-500 z-10" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-lg pl-9 pr-8 py-2 outline-none cursor-pointer hover:border-blue-400 transition-all"
            >
              <option value="all">Semua Data</option>
              <option value="3m">3 Bulan</option>
              <option value="6m">6 Bulan</option>
              <option value="12m">12 Bulan</option>
              <option value="2y">2 Tahun</option>
            </select>
          </div>

          {/* Dropdown tambah produk */}
          <select
            className="appearance-none bg-gray-900 text-white text-xs font-bold rounded-lg px-4 py-2 outline-none cursor-pointer hover:bg-blue-600 transition-all"
            onChange={(e) => e.target.value && handleSelect(e.target.value)}
            value=""
          >
            <option value="">+ Banding Produk</option>
            {productList.map(p => (
              <option key={p} value={p} disabled={selectedProducts.includes(p)} className="bg-white text-gray-800">
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tag produk yang dipilih */}
      <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
        {selectedProducts.map((p, idx) => (
          <div
            key={p}
            style={{
              backgroundColor: `${colors[idx % colors.length]}15`,
              color: colors[idx % colors.length],
              border: `1px solid ${colors[idx % colors.length]}40`
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
            {p}
            <button onClick={() => handleSelect(p)} className="ml-1 hover:opacity-60">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0 relative">
        {!hasValidData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
            <TrendingUp className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Menunggu Data Produk...</p>
          </div>
        ) : (
          <div className="w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 'bold' }}
                  tickFormatter={(val) => `${val}u`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [`${value} unit`, name]}
                  labelFormatter={(label) => `Minggu: ${new Date(label).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                  contentStyle={{
                    borderRadius: '20px',
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)',
                    padding: '15px'
                  }}
                />

                {selectedProducts.map((p, idx) => (
                  <Line
                    key={p}
                    type="monotone"
                    dataKey={p}
                    name={p}
                    stroke={colors[idx % colors.length]}
                    strokeWidth={4}
                    dot={{ r: 4, fill: colors[idx % colors.length], strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductChart;