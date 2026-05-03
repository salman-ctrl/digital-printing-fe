import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HistoryData = () => {
    const [deletedData, setDeletedData] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        loadAndCleanHistory();
    }, []);

    const loadAndCleanHistory = () => {
        const rawData = JSON.parse(localStorage.getItem('softDeletedTransactions') || '[]');
        const now = new Date();
        const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

        const validData = rawData.filter(item => {
            const deletedDate = new Date(item.deletedAt);
            return (now - deletedDate) < FIVE_DAYS_MS;
        });

        localStorage.setItem('softDeletedTransactions', JSON.stringify(validData));
        setDeletedData(validData);
    };

    const calculateDaysLeft = (deletedAt) => {
        const diffTime = new Date() - new Date(deletedAt);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return 5 - diffDays;
    };

    const handleRestore = (id) => {
        const remaining = deletedData.filter(t => t.id_transaksi !== id);
        localStorage.setItem('softDeletedTransactions', JSON.stringify(remaining));
        setDeletedData(remaining);
        alert(`Transaksi #${id} telah dikembalikan ke daftar utama.`);
        window.location.reload(); // Refresh untuk sync data
    };

    return (
        <div className="w-full px-4 py-8 space-y-8">
            <button
                onClick={() => navigate(-1)}
                className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-all font-bold text-lg"
            >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" /> Kembali ke Dashboard
            </button>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-xl flex items-center gap-4">
                <AlertCircle className="w-8 h-8 text-amber-500" />
                <div>
                    <h2 className="text-xl font-bold text-amber-800">Histori Data Terhapus</h2>
                    <p className="text-amber-700">Data di bawah ini akan dihapus secara <b>permanen</b> oleh sistem setelah melewati batas 5 hari.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600 font-bold uppercase tracking-wider">
                        <tr>
                            <th className="px-8 py-5">ID Transaksi</th>
                            <th className="px-8 py-5">Nama Pelanggan</th>
                            <th className="px-8 py-5 text-center">Tanggal Dihapus</th>
                            <th className="px-8 py-5 text-center">Sisa Waktu</th>
                            <th className="px-8 py-5 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {deletedData.length === 0 ? (
                            <tr><td colSpan="5" className="p-20 text-center text-gray-400 text-xl italic font-medium">Belum ada data di tempat sampah.</td></tr>
                        ) : (
                            deletedData.map((trx) => (
                                <tr key={trx.id_transaksi} className="hover:bg-red-50/30 transition-colors">
                                    <td className="px-8 py-6 font-mono font-bold text-gray-400 text-lg">#{trx.id_transaksi}</td>
                                    <td className="px-8 py-6 font-bold text-gray-800 text-lg">{trx.nama_pelanggan}</td>
                                    <td className="px-8 py-6 text-center text-gray-500 font-medium">
                                        {new Date(trx.deletedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-2 rounded-full text-sm font-black shadow-sm ${calculateDaysLeft(trx.deletedAt) <= 1 ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'
                                            }`}>
                                            {calculateDaysLeft(trx.deletedAt)} HARI LAGI
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <button
                                            onClick={() => handleRestore(trx.id_transaksi)}
                                            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-md shadow-blue-100"
                                        >
                                            <RefreshCw className="w-4 h-4" /> Pulihkan
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HistoryData;