import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { getAllProducts, deleteProduct } from '../api/products';
import { Plus, Search, Edit2, Trash2, Package, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Badge from '../components/common/Badge';
import { formatRupiah } from '../utils/formatters';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debugData, setDebugData] = useState(null);
  const navigate = useNavigate();

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, []);

  // Reset halaman ke 1 setiap kali melakukan pencarian
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getAllProducts();

      // Logika Ekstraksi Data Aman
      let dataArray = [];
      if (Array.isArray(response)) dataArray = response;
      else if (Array.isArray(response?.data)) dataArray = response.data;
      else if (Array.isArray(response?.data?.products)) dataArray = response.data.products;
      else if (Array.isArray(response?.products)) dataArray = response.products;

      if (dataArray.length > 0) {
        setProducts(dataArray);
        setDebugData(null);
      } else {
        setDebugData(response);
        setProducts([]);
      }
    } catch (error) {
      console.error("Gagal ambil produk:", error);
      setDebugData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus produk ini?')) {
      try {
        await deleteProduct(id);
        fetchProducts(); // Refresh list
      } catch (error) {
        alert("Gagal menghapus produk.");
      }
    }
  };

  // 1. Filter Data (Pencarian)
  const filteredProducts = products.filter(p =>
    p.nama_produk?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Logika Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Produk</h1>
        {/* Tombol Tambah -> Pindah ke Halaman Form */}
        <button
          onClick={() => navigate('/products/create')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Produk
        </button>
      </div>

      {/* Debug View jika kosong */}
      {products.length === 0 && !loading && debugData && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>Data kosong, silahkan tambahkan produk!</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama produk..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Produk</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Stok</th>
                <th className="px-6 py-4">Harga</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Tidak ada produk ditemukan.</td></tr>
              ) : (
                // MAPPING data halaman ini saja (currentItems)
                currentItems.map((product) => (
                  <tr key={product.id_produk} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                          {/* Tampilkan Thumbnail jika ada */}
                          {product.gambar_utama || product.gambar_url ? (
                            <img src={product.gambar_url || product.gambar_utama} alt={product.nama_produk} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{product.nama_produk}</p>
                          <p className="text-xs text-gray-500 font-mono">ID: {product.id_produk}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {product.nama_kategori || 'Umum'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={product.stok < 10 ? 'text-red-600 font-bold' : 'text-gray-700'}>
                        {product.stok}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {formatRupiah(product.harga)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge type={product.stok > 0 ? 'success' : 'danger'}>
                        {product.stok > 0 ? 'Ready' : 'Habis'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Tombol Detail */}
                        <button
                          onClick={() => navigate(`/products/${product.id_produk}`)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Tombol Edit */}
                        <button
                          onClick={() => navigate(`/products/edit/${product.id_produk}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {/* Tombol Hapus */}
                        <button
                          onClick={() => handleDelete(product.id_produk)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Tabel dengan Pagination */}
        {!loading && products.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
            <span>
              Menampilkan {filteredProducts.length === 0 ? 0 : indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredProducts.length)} dari {filteredProducts.length} produk
            </span>
            <div className="flex gap-2 items-center">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" /> Sebelumnya
              </button>

              <span className="font-medium text-gray-700">
                Halaman {currentPage} / {totalPages || 1}
              </span>

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Selanjutnya <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;