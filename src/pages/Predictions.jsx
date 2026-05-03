import { useState } from 'react';
import { runArimaPrediction } from '../api/predictions';
import PredictionChart from '../components/charts/PredictionChart';
import { Loader2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

const Predictions = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    start_date: '2024-01-01',
    end_date: '2025-12-31',
    forecast_steps: 4
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [debugData, setDebugData] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    setDebugData(null);

    try {
      const response = await runArimaPrediction(formData);
      console.log("🔮 RAW PREDICTION RESPONSE:", response);

      // --- EKSTRAKSI DATA DARI BACKEND ---
      let dataRoot = response;
      
      if (response && response.data) {
        dataRoot = response.data;
      }

      console.log("📊 DATA ROOT:", dataRoot);

      // Validasi struktur data
      if (!dataRoot) {
        setError("Response dari server kosong.");
        setDebugData(response);
        return;
      }

      // Cek apakah ada historical_data dan predictions
      if (!dataRoot.historical_data) {
        console.error("❌ historical_data tidak ditemukan");
        setError("Data historical_data tidak ditemukan di response.");
        setDebugData(response);
        return;
      }

      if (!dataRoot.predictions || !Array.isArray(dataRoot.predictions)) {
        console.error("❌ predictions tidak ditemukan atau bukan array");
        setError("Data predictions tidak valid.");
        setDebugData(response);
        return;
      }

      const historicalData = dataRoot.historical_data;
      const predictions = dataRoot.predictions;

      // Validasi historical_data
      if (!historicalData.dates || !historicalData.values) {
        console.error("❌ historical_data.dates atau values tidak ada");
        setError("Format historical_data tidak lengkap.");
        setDebugData(response);
        return;
      }

      if (!Array.isArray(historicalData.dates) || !Array.isArray(historicalData.values)) {
        console.error("❌ dates atau values bukan array");
        setError("Format historical_data tidak valid.");
        setDebugData(response);
        return;
      }

      console.log("📊 HISTORICAL DATA:", historicalData);
      console.log("📊 PREDICTIONS:", predictions);

      // --- TRANSFORMASI DATA UNTUK GRAFIK ---
      // Backend mengirim historical_data dengan dates dan values terpisah
      const historyData = historicalData.dates.map((date, idx) => ({
        date: date,
        actual: historicalData.values[idx],
        forecast: null
      }));

      // Generate tanggal untuk forecast (7 hari setelah data terakhir)
      const lastDate = new Date(historicalData.dates[historicalData.dates.length - 1]);
      const forecastData = predictions.map((value, idx) => {
        const newDate = new Date(lastDate);
        newDate.setDate(lastDate.getDate() + ((idx + 1) * 7)); // +7 hari per minggu
        return {
          date: newDate.toISOString().split('T')[0],
          actual: null,
          forecast: value
        };
      });

      // Sambungkan titik terakhir history dengan forecast untuk visualisasi mulus
      if (historyData.length > 0 && forecastData.length > 0) {
        forecastData[0].actual = historyData[historyData.length - 1].actual;
      }

      const combinedData = [...historyData, ...forecastData];
      console.log("📈 COMBINED DATA FOR CHART:", combinedData);

      if (combinedData.length === 0) {
        setError("Data yang diterima kosong.");
        setDebugData(response);
        return;
      }

      setResult(combinedData);

    } catch (err) {
      console.error("❌ Gagal menjalankan prediksi:", err);
      
      // Cek apakah error 404 (Route not found)
      if (err.response?.status === 404) {
        setError('Endpoint API prediksi belum tersedia di backend. Pastikan route /api/prediction/arima sudah dibuat.');
      } else {
        const msg = err.response?.data?.message || err.message || 'Terjadi kesalahan saat memproses prediksi';
        setError(msg);
      }
      
      setDebugData({
        status: err.response?.status,
        statusText: err.response?.statusText,
        url: err.config?.url,
        method: err.config?.method,
        data: err.response?.data,
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Prediksi Penjualan</h1>
          <p className="text-sm text-gray-500 mt-1">Gunakan model ARIMA untuk meramalkan tren pendapatan mingguan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Kontrol */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Parameter Model
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mulai Data Latih</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Akhir Data Latih</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Langkah Prediksi (Minggu)</label>
              <input
                type="number"
                name="forecast_steps"
                min="1"
                max="12"
                value={formData.forecast_steps}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Maksimal 12 minggu ke depan.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
              {loading ? 'Sedang Memproses...' : 'Jalankan ARIMA'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-800 text-sm rounded-lg border border-red-200">
              <div className="flex gap-2 items-start mb-2">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-red-600" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-1">Error:</p>
                  <p>{error}</p>
                  
                  {error.includes('Route not found') && (
                    <div className="mt-3 p-3 bg-white rounded border border-red-200">
                      <p className="font-semibold text-gray-800 mb-2">Solusi:</p>
                      <ol className="text-xs text-gray-700 space-y-1 list-decimal list-inside">
                        <li>Pastikan backend Laravel sudah running</li>
                        <li>Cek file <code className="bg-gray-100 px-1 py-0.5 rounded">routes/api.php</code></li>
                        <li>Tambahkan route: <code className="bg-gray-100 px-1 py-0.5 rounded">Route::post('/prediction/arima', [PredictionController::class, 'runArima']);</code></li>
                        <li>Buat controller dengan method yang sesuai</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Area Grafik & Hasil */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Debug View */}
          {debugData && (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
              <div className="flex items-center gap-2 font-bold mb-2 text-yellow-900">
                <AlertCircle className="w-5 h-5" />
                <span>Debug Info</span>
              </div>
              
              {debugData.status === 404 ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    🔍 <strong>Status:</strong> {debugData.status} - {debugData.statusText}
                  </p>
                  <p className="text-sm">
                    🌐 <strong>URL:</strong> <code className="bg-yellow-100 px-1 py-0.5 rounded">{debugData.url}</code>
                  </p>
                  <p className="text-sm">
                    📝 <strong>Method:</strong> {debugData.method?.toUpperCase()}
                  </p>
                  <div className="mt-3 p-3 bg-white rounded border border-yellow-300">
                    <p className="font-semibold text-gray-800 mb-1">Yang perlu diperiksa:</p>
                    <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                      <li>Apakah file <code className="bg-gray-100 px-1">api/predictions.js</code> sudah benar?</li>
                      <li>Apakah endpoint di backend sudah sesuai?</li>
                      <li>Coba akses langsung: <code className="bg-gray-100 px-1">http://localhost:8000/api/prediction/arima</code></li>
                    </ul>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-2 text-xs">Response dari backend:</p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-60 text-xs font-mono shadow-inner">
                    {JSON.stringify(debugData, null, 2)}
                  </pre>
                </>
              )}
            </div>
          )}

          {result ? (
            <div className="animate-in fade-in duration-300">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <PredictionChart data={result} />
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5" /> Analisis Singkat
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Model ARIMA berhasil memproyeksikan penjualan untuk <strong>{formData.forecast_steps} minggu</strong> ke depan 
                  berdasarkan pola data historis. Garis <span className="text-blue-600 font-semibold">biru</span> menunjukkan 
                  data aktual, sedangkan garis <span className="text-red-600 font-semibold">merah putus-putus</span> adalah 
                  hasil prediksi.
                </p>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    💡 <strong>Tips:</strong> Semakin banyak data historis yang digunakan (rentang tanggal lebih panjang), 
                    semakin akurat prediksi yang dihasilkan.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[500px] bg-white rounded-xl border-2 border-gray-200 border-dashed flex flex-col items-center justify-center text-gray-400">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <TrendingUp className="w-10 h-10 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-600 text-lg">Belum ada data prediksi</p>
              <p className="text-sm text-gray-500 mt-1">Silakan atur parameter di panel kiri dan klik "Jalankan ARIMA"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Predictions;