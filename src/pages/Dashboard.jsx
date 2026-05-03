import { useEffect, useState } from 'react';
import { getDashboardStats, getWeeklySales, getProductTrend } from '../api/transactions';
import { runArimaPrediction } from '../api/predictions';
import { DollarSign, ShoppingBag, TrendingUp, Calendar, Zap, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import StatCard from '../components/dashboard/StatCard';
import SalesChart from '../components/charts/SalesChart';
import ProductChart from '../components/charts/ProductChart';
import { formatRupiah } from '../utils/formatters';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_pendapatan: 0,
    total_transaksi: 0,
    pendapatan_hari_ini: 0,
    rata_rata_transaksi: 0
  });

  const [loading, setLoading] = useState(true);
  const [isPredicting, setIsPredicting] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [predictionData, setPredictionData] = useState(null);
  const [forecastSteps, setForecastSteps] = useState(4);
  const [viewRange, setViewRange] = useState('all');
  const [productData, setProductData] = useState([]);

  // ============================================================
  // HELPERS
  // ============================================================
  const formatDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDateParams = (range) => {
    const endDate = new Date();
    const startDate = new Date();
    switch (range) {
      case '1m': startDate.setMonth(endDate.getMonth() - 1); break;
      case '3m': startDate.setMonth(endDate.getMonth() - 3); break;
      case '6m': startDate.setMonth(endDate.getMonth() - 6); break;
      case '10m': startDate.setMonth(endDate.getMonth() - 10); break;
      case 'year': startDate.setFullYear(endDate.getFullYear() - 1); break;
      case 'all': return { start_date: '2020-01-01', end_date: formatDateStr(endDate) };
      default: startDate.setMonth(endDate.getMonth() - 6);
    }
    return { start_date: formatDateStr(startDate), end_date: formatDateStr(endDate) };
  };

  // ============================================================
  // INIT
  // ============================================================
  useEffect(() => {
    const initDashboard = async () => {
      try {
        setLoading(true);
        const statsRes = await getDashboardStats();
        const statsData = statsRes?.data?.stats || statsRes?.stats || statsRes?.data || {};
        setStats(statsData);
        await loadHistoryData(viewRange);
        await loadProductData();
      } catch (err) {
        console.error('Init Error:', err);
      } finally {
        setLoading(false);
      }
    };
    initDashboard();
  }, []);

  useEffect(() => {
    if (!loading) loadHistoryData(viewRange);
  }, [viewRange]);

  // ============================================================
  // LOAD DATA
  // ============================================================
  const loadHistoryData = async (range) => {
    try {
      const params = getDateParams(range);
      const response = await getWeeklySales(params);
      let rawData = response?.data?.data || response?.data || response || [];

      const formatted = rawData.map(item => ({
        name: item.tanggal || item.tanggal_transaksi || item.date,
        total: Number(item.total_penjualan || item.total_harga || 0),
        forecast: null
      })).sort((a, b) => new Date(a.name) - new Date(b.name));

      setHistoryData(formatted);
      if (predictionData) {
        mergeData(formatted, predictionData);
      } else {
        setChartData(formatted);
      }
    } catch (e) {
      console.error('Load history failed:', e);
    }
  };

  const loadProductData = async () => {
    try {
      const params = { start_date: '2020-01-01', end_date: formatDateStr(new Date()) };
      const response = await getProductTrend(params);
      const rawData = response?.data?.data || response?.data || [];

      const formatted = rawData.map(item => ({
        product_name: item.product_name,
        total: Number(item.total || 0),
        date: item.date
      }));

      setProductData(formatted);
    } catch (e) {
      console.error('Load product trend failed:', e);
    }
  };

  // ============================================================
  // MERGE HISTORY + FORECAST
  // ============================================================
  const mergeData = (hist, pred) => {
    if (!pred || pred.length === 0) {
      setChartData(hist);
      return;
    }
    let newChartData = [...hist];
    const last = newChartData[newChartData.length - 1];
    if (last) {
      newChartData[newChartData.length - 1] = { ...last, forecast: last.total };
    }
    newChartData = [...newChartData, ...pred];
    setChartData(newChartData);
  };

  // ============================================================
  // PREDIKSI ARIMA
  // ============================================================
  const handleRunPrediction = async (e) => {
    e.preventDefault();
    setIsPredicting(true);

    const steps = parseInt(forecastSteps) || 4;

    // Validasi maksimal minggu
    if (steps > 52) {
      Swal.fire({
        icon: 'warning',
        title: 'Terlalu Jauh!',
        html: `
          <p style="color:#374151;">Prediksi maksimal <b>52 minggu</b> ke depan.</p>
          <p style="color:#d97706; margin-top:8px; font-size:13px;">
            ⚠️ Akurasi model ARIMA menurun drastis untuk prediksi di atas 52 minggu.
          </p>
        `,
        confirmButtonText: 'Oke, Mengerti',
        confirmButtonColor: '#3b82f6',
      });
      setIsPredicting(false);
      return;
    }

    // Peringatan kalau terlalu jauh tapi masih boleh
    if (steps > 26) {
      const confirm = await Swal.fire({
        icon: 'question',
        title: 'Lanjutkan Prediksi?',
        html: `
          <p style="color:#374151;">Kamu memilih prediksi <b>${steps} minggu</b> ke depan.</p>
          <p style="color:#d97706; margin-top:8px; font-size:13px;">
            ⚠️ Prediksi di atas 26 minggu cenderung kurang akurat. Disarankan maksimal 12–26 minggu untuk hasil terbaik.
          </p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Ya, Tetap Lanjutkan',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
      });
      if (!confirm.isConfirmed) {
        setIsPredicting(false);
        return;
      }
    }

    try {
      const today = new Date();
      const payload = {
        forecast_steps: steps,
        start_date: '2020-01-01',
        end_date: formatDateStr(today)
      };

      const response = await runArimaPrediction(payload);
      let dataRoot = response.data || response;

      if (!dataRoot) {
        throw new Error('Respons dari server kosong.');
      }
      if (!dataRoot.predictions) {
        throw new Error('Format respons tidak valid: field "predictions" tidak ditemukan.');
      }
      if (!Array.isArray(dataRoot.predictions)) {
        throw new Error('"predictions" harus berupa array, bukan ' + typeof dataRoot.predictions);
      }
      if (dataRoot.predictions.length === 0) {
        throw new Error('Server mengembalikan prediksi kosong. Pastikan data historis mencukupi.');
      }

      const forecastPoints = dataRoot.predictions.map((val, idx) => {
        const nextDate = new Date(today);
        nextDate.setDate(today.getDate() + ((idx + 1) * 7));
        return { name: formatDateStr(nextDate), total: null, forecast: Number(val) };
      });

      setPredictionData(forecastPoints);
      mergeData(historyData, forecastPoints);

      Swal.fire({
        icon: 'success',
        title: 'Prediksi Berhasil!',
        text: `${steps} minggu ke depan berhasil diprediksi menggunakan model ARIMA.`,
        confirmButtonText: 'Lihat Grafik',
        confirmButtonColor: '#3b82f6',
        timer: 3000,
        timerProgressBar: true,
      });

    } catch (err) {
      console.error('Prediction Error:', err);

      const isNetwork = !err.response && (err.message?.toLowerCase().includes('network') || err.message?.toLowerCase().includes('connect'));
      const serverMsg = err.response?.data?.message || err.response?.data?.error;
      const statusCode = err.response?.status;

      let pesanUtama = serverMsg || "Prediksi gagal diproses. Silakan coba beberapa saat lagi";
      let pesanTips = '';

      if (isNetwork) {
        pesanUtama = 'Tidak dapat terhubung ke server prediksi. Pastikan backend Python/Flask sedang berjalan.';
      } else if (statusCode === 422 || statusCode === 400) {
        pesanUtama = serverMsg || 'Data yang dikirim tidak valid atau tidak cukup untuk diproses ARIMA.';
        pesanTips = 'Pastikan data historis transaksi sudah cukup (minimal beberapa bulan).';
      } else if (statusCode === 500) {
        pesanUtama = serverMsg || 'Server mengalami error internal saat memproses prediksi.';
        pesanTips = 'Coba kurangi jumlah minggu prediksi atau periksa log server.';
      } else if (steps > 26) {
        pesanTips = `Prediksi ${steps} minggu mungkin terlalu jauh. Coba kurangi ke 12–26 minggu.`;
      }

      Swal.fire({
        icon: 'error',
        title: 'Prediksi Gagal',
        html: `
          <div style="text-align:left; font-size:14px; color:#374151; line-height:1.6;">
            <p style="margin-bottom:8px;"><b>Penyebab:</b></p>
            <div style="background:#fef2f2; padding:12px; border-radius:10px; color:#dc2626; border: 1px solid #fecaca;">
              ${pesanUtama}
            </div>
            ${pesanTips ? `
            <div style="background:#fffbeb; padding:10px; border-radius:10px; color:#d97706; border: 1px solid #fde68a; margin-top:10px;">
              ⚠️ <b>Tips:</b> ${pesanTips}
            </div>` : ''}
          </div>
        `,
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#ef4444',
      });

    } finally {
      setIsPredicting(false);
    }
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Analitik</h1>
          <p className="text-gray-500 mt-1">Pantau kinerja dan prediksi tren penjualan masa depan.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pendapatan" value={formatRupiah(Number(stats.total_pendapatan || 0))} icon={DollarSign} color="green" />
        <StatCard title="Total Transaksi" value={Number(stats.total_transaksi || 0)} icon={ShoppingBag} color="blue" />
        <StatCard title="Pendapatan Hari Ini" value={formatRupiah(Number(stats.pendapatan_hari_ini || 0))} icon={TrendingUp} color="purple" />
        <StatCard title="Rata-rata Transaksi" value={formatRupiah(Number(stats.rata_rata_transaksi || 0))} icon={Calendar} color="orange" />
      </div>

      <div className="flex flex-col gap-8">
        <div className="space-y-6">

          {/* Sales Chart */}
          <div className="relative">
            <div className="absolute top-4 right-4 z-10">
              <select
                value={viewRange}
                onChange={(e) => setViewRange(e.target.value)}
                className="bg-white border border-gray-200 text-xs rounded-lg px-2 py-1 outline-none shadow-sm cursor-pointer hover:border-blue-400"
              >
                <option value="all">Semua Data</option>
                <option value="year">1 Tahun</option>
                <option value="6m">6 Bulan</option>
                <option value="3m">3 Bulan</option>
              </select>
            </div>
            <SalesChart
              data={chartData}
              title={predictionData ? 'Tren Penjualan & Prediksi (ARIMA)' : 'Grafik Pendapatan Historis'}
            />
          </div>

          {/* ARIMA Panel */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  Jalankan Prediksi (ARIMA)
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Menggunakan seluruh data historis untuk akurasi terbaik.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                <span className="text-sm text-gray-600 pl-2">Prediksi</span>
                <input
                  type="number" min="1" max="52"
                  value={forecastSteps}
                  onChange={(e) => setForecastSteps(e.target.value)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 bg-white"
                />
                <span className="text-sm text-gray-600">Minggu kedepan</span>
                <button
                  onClick={handleRunPrediction}
                  disabled={isPredicting}
                  className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 disabled:opacity-70 transition-all shadow-sm"
                >
                  {isPredicting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Zap className="w-4 h-4" />
                  }
                  Mulai
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Chart */}
        <ProductChart data={productData} title="Tren Pola Produk" />
      </div>
    </div>
  );
};

export default Dashboard;