import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllCategories, deleteCategory } from '../api/categories';
import { Plus, Search, Edit2, Trash2, ChevronRight, FolderTree, AlertCircle, Loader2 } from 'lucide-react';
import { showSuccess, showError, showConfirm, closeAlert } from '../utils/alert';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debugData, setDebugData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchRootCategories();
    }, []);

    const fetchRootCategories = async () => {
        try {
            setLoading(true);
            const response = await getAllCategories({ is_root: true });
            console.log("📂 Raw Categories Response:", response);

            let data = [];
            // Ekstraksi data yang aman
            if (Array.isArray(response)) data = response;
            else if (response?.data?.categories && Array.isArray(response.data.categories)) data = response.data.categories;
            else if (response?.categories && Array.isArray(response.categories)) data = response.categories;
            else if (response?.data && Array.isArray(response.data)) data = response.data;

            setCategories(data);
            if (data.length === 0 && !Array.isArray(response) && !response?.data?.categories) {
                setDebugData(response);
            } else {
                setDebugData(null);
            }

        } catch (err) {
            console.error("Gagal load root categories:", err);
            showError("Error", "Gagal memuat data kategori.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const isConfirmed = await showConfirm(
            "Hapus Kategori?",
            "Sub-kategori dan produk di dalamnya mungkin akan kehilangan induknya.",
            "Ya, Hapus"
        );

        if (isConfirmed) {
            try {
                await deleteCategory(id);
                closeAlert();
                showSuccess("Berhasil", "Kategori dihapus.");
                fetchRootCategories();
            } catch (err) {
                closeAlert();
                showError("Gagal", err.response?.data?.message || "Gagal menghapus kategori.");
            }
        }
    };

    // Helper untuk konstruksi URL Gambar yang benar
    const getImageUrl = (cat) => {
        if (cat.gambar_url) return cat.gambar_url;
        const path = cat.gambar || cat.image;
        if (!path) return null;
        if (path.startsWith('http')) return path;
        // Paksa ke port 5000 (Backend) karena frontend di 5173
        return `http://localhost:5000${path.startsWith('/') ? '' : '/'}${path}`;
    };

    const filtered = categories.filter(c => {
        if (!c) return false;
        const name = c.nama_kategori || c.name || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kategori Utama</h1>
                    <p className="text-sm text-gray-500">Daftar kategori level teratas.</p>
                </div>
                <button
                    onClick={() => navigate('/categories/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Tambah Kategori
                </button>
            </div>

            {categories.length === 0 && !loading && debugData && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 mb-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4" />
                        <span>Data Kosong / Format Respon Beda</span>
                    </div>
                    <pre className="bg-gray-900 text-green-400 p-3 rounded overflow-auto max-h-40 text-xs font-mono">
                        {JSON.stringify(debugData, null, 2)}
                    </pre>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari kategori utama..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 w-16">ID</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4">Struktur</th>
                                <th className="px-6 py-4 text-center">Jumlah Sub-Kategori</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" /> Memuat data...
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Tidak ada kategori utama.</td></tr>
                            ) : (
                                filtered.map((cat, idx) => (
                                    <tr key={cat.id_kategori || cat.id || idx} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4 font-mono text-gray-500">#{cat.id_kategori || cat.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                    {getImageUrl(cat) ? (
                                                        <img
                                                            src={getImageUrl(cat)}
                                                            alt={cat.nama_kategori || cat.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100?text=No+Image" }}
                                                        />
                                                    ) : (
                                                        <FolderTree className="w-5 h-5 text-blue-500" />
                                                    )}
                                                </div>
                                                {cat.nama_kategori || cat.name || 'Tanpa Nama'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">Root / Utama</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cat.children_count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {cat.children_count || 0} Sub-kategori
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link to={`/categories/${cat.id_kategori || cat.id}`} className="p-2 text-gray-600 hover:text-blue-600 border border-gray-200 rounded-lg hover:bg-gray-50" title="Buka Detail">
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                                <button onClick={() => navigate(`/categories/edit/${cat.id_kategori || cat.id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100 transition-all">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(cat.id_kategori || cat.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Categories;