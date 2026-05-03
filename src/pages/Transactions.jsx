import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CSVLink } from 'react-csv';
import { getAllTransactions } from '../api/transactions';
import { Download, Search, FileText, Trash2, History, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import Badge from '../components/common/Badge';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // --- State Pagination Tambahan ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default 10

  useEffect(() => {
    fetchData();
  }, []);

  // Reset ke halaman 1 jika user mencari sesuatu atau mengubah jumlah per halaman
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getAllTransactions();
      const dataArray = response?.data?.transactions || response?.data || [];
      const softDeletedIds = JSON.parse(localStorage.getItem('softDeletedTransactions') || '[]').map(item => item.id_transaksi);
      setTransactions(dataArray.filter(t => !softDeletedIds.includes(t.id_transaksi)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = (transaction) => {
    if (window.confirm(`Pindahkan transaksi #${transaction.id_transaksi} ke histori data (sampah)?`)) {
      const deletedItem = { ...transaction, deletedAt: new Date().toISOString() };
      const currentTrash = JSON.parse(localStorage.getItem('softDeletedTransactions') || '[]');
      localStorage.setItem('softDeletedTransactions', JSON.stringify([...currentTrash, deletedItem]));
      setTransactions(prev => prev.filter(t => t.id_transaksi !== transaction.id_transaksi));
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(trx =>
      String(trx.id_transaksi || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(trx.nama_pelanggan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  // --- Kalkulasi Data Per Halaman ---
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const lastIdx = currentPage * itemsPerPage;
    const firstIdx = lastIdx - itemsPerPage;
    return filteredTransactions.slice(firstIdx, lastIdx);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Helper Pagination Numbers
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="w-full px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Riwayat Transaksi</h1>
          <p className="text-gray-500 mt-1">Kelola dan pantau seluruh transaksi masuk Anda.</p>
        </div>

        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <button
            onClick={() => navigate('/history-data')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-amber-200 text-amber-700 rounded-xl hover:bg-amber-50 transition-all font-bold"
          >
            <History className="w-5 h-5" /> Histori Data
          </button>

          <CSVLink
            data={filteredTransactions}
            filename={`Laporan-Transaksi-${new Date().getTime()}.csv`}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-bold shadow-lg shadow-emerald-100"
          >
            <Download className="w-5 h-5" /> Export Laporan (CSV)
          </CSVLink>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari ID transaksi atau nama pelanggan..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Selector Baris Per Halaman */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">Tampilkan:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value={10}>10 Baris</option>
              <option value={20}>20 Baris</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-800 text-white font-semibold">
              <tr>
                <th className="px-8 py-5 text-base">ID Transaksi</th>
                <th className="px-8 py-5 text-base">Nama Pelanggan</th>
                <th className="px-8 py-5 text-base">Total Bayar</th>
                <th className="px-8 py-5 text-base">Status</th>
                <th className="px-8 py-5 text-base text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center text-xl text-gray-400">Sedang memuat data...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-gray-500 italic">Data transaksi tidak ditemukan.</td></tr>
              ) : (
                currentItems.map((trx) => (
                  <tr key={trx.id_transaksi} className="hover:bg-blue-50/50 transition-colors group">
                    <td className="px-8 py-6 font-mono font-bold text-blue-600 text-lg">#{trx.id_transaksi}</td>
                    <td className="px-8 py-6">
                      <div className="font-bold text-gray-900 text-lg">{trx.nama_pelanggan}</div>
                      <div className="text-xs text-gray-400">ID Pelanggan: {trx.id_pelanggan}</div>
                    </td>
                    <td className="px-8 py-6 font-extrabold text-gray-900 text-lg">
                      Rp {trx.total_harga?.toLocaleString('id-ID')}
                    </td>
                    <td className="px-8 py-6">
                      <Badge type={['Lunas', 'Paid', 'Success'].includes(trx.status_pembayaran) ? 'success' : 'warning'}>
                        <span className="text-sm uppercase font-black">{trx.status_pembayaran || 'Pending'}</span>
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => navigate(`/transactions/${trx.id_transaksi || trx.id}`)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"
                        >
                          <FileText className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => handleSoftDelete(trx)}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredTransactions.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-500">
              Menampilkan <span className="text-gray-900 font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="text-gray-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> dari <span className="text-gray-900 font-bold">{filteredTransactions.length}</span> transaksi
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) => (
                  page === '...' ? (
                    <span key={`dots-${idx}`} className="px-2 text-gray-400"><MoreHorizontal className="w-4 h-4" /></span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === page
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'text-gray-600 hover:bg-white border border-transparent hover:border-gray-200'
                        }`}
                    >
                      {page}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;