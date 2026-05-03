import { useState, useEffect, useMemo } from 'react';
import { getAllCustomers } from '../api/customers';
import { Search, Mail, Phone, MapPin, User, AlertCircle, Trash2, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import Badge from '../components/common/Badge';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugData, setDebugData] = useState(null);

  // --- State Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Reset page saat filter/limit berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getAllCustomers();

      let dataArray = [];
      if (Array.isArray(response)) {
        dataArray = response;
      } else if (response?.data?.customers) {
        dataArray = response.data.customers;
      } else if (response?.data?.data) {
        dataArray = response.data.data;
      } else if (response?.data) {
        dataArray = response.data;
      }

      if (dataArray.length > 0) {
        setCustomers(dataArray);
        setDebugData(null);
      } else {
        setDebugData(response);
        setCustomers([]);
      }
    } catch (error) {
      setDebugData({ error: error.message });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Delete Permanen (Tanpa Soft Delete)
  const handleDelete = (id, nama) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pelanggan "${nama}" secara permanen?`)) {
      // Di sini biasanya panggil API delete: await deleteCustomer(id)
      setCustomers(prev => prev.filter(c => c.id_pelanggan !== id));
      alert("Pelanggan berhasil dihapus.");
    }
  };

  // Filter Data
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const term = searchTerm.toLowerCase();
      return (
        String(customer.nama || '').toLowerCase().includes(term) ||
        String(customer.email || '').toLowerCase().includes(term) ||
        String(customer.no_hp || '').toLowerCase().includes(term)
      );
    });
  }, [customers, searchTerm]);

  // Kalkulasi Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const lastIdx = currentPage * itemsPerPage;
    const firstIdx = lastIdx - itemsPerPage;
    return filteredCustomers.slice(firstIdx, lastIdx);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) pages.push(1, 2, 3, 4, 5, '...', totalPages);
      else if (currentPage >= totalPages - 3) pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div className="w-full px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Data Pelanggan</h1>
          <p className="text-gray-500 mt-1">Total terdaftar: {customers.length} Pelanggan</p>
        </div>
      </div>

      {/* Kontainer Tabel Besar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari nama, email, atau no HP..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-base outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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
                <th className="px-8 py-5 text-base">Identitas Pelanggan</th>
                <th className="px-8 py-5 text-base">Kontak & Alamat</th>
                <th className="px-8 py-5 text-base">Bergabung</th>
                <th className="px-8 py-5 text-base text-center">Status</th>
                <th className="px-8 py-5 text-base text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {loading ? (
                <tr><td colSpan="5" className="p-20 text-center text-xl text-gray-400 italic">Memuat data pelanggan...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="5" className="p-20 text-center text-gray-500 italic font-medium">Data tidak ditemukan.</td></tr>
              ) : (
                currentItems.map((customer, idx) => (
                  <tr key={customer.id_pelanggan || idx} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shadow-sm">
                          {customer.nama ? customer.nama.charAt(0).toUpperCase() : <User />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                            {customer.nama || 'Tanpa Nama'}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">ID: {customer.id_pelanggan}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4 text-blue-400" /> {customer.email || '-'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-emerald-400" /> {customer.no_hp || '-'}
                        </div>
                        <div className="flex items-start gap-2 text-xs text-gray-400 italic">
                          <MapPin className="w-4 h-4 shrink-0" /> {customer.alamat || 'Alamat Kosong'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-gray-600 font-medium">
                      {customer.tanggal_daftar ? new Date(customer.tanggal_daftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="px-8 py-6 text-center">
                      <Badge type="success">AKTIF</Badge>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button
                        onClick={() => handleDelete(customer.id_pelanggan, customer.nama)}
                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {!loading && filteredCustomers.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-500">
              Menampilkan <span className="text-gray-900 font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="text-gray-900 font-bold">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> dari <span className="text-gray-900 font-bold">{filteredCustomers.length}</span> pelanggan
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
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === page ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-white border border-transparent'
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

export default Customers;