import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCategoryById, getAllCategories } from '../api/categories';
import { getAllProducts } from '../api/products';
import { ArrowLeft, Package, Layers, Tag, ChevronRight, Folder } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import Badge from '../components/common/Badge';

const CategoryDetail = () => {
    const { id } = useParams(); // ID Kategori saat ini dari URL
    const navigate = useNavigate();

    const [currentCategory, setCurrentCategory] = useState(null);
    const [subCategories, setSubCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Ambil data setiap kali ID berubah (saat klik sub-kategori)
    useEffect(() => {
        // Validasi: Jika id adalah string "undefined", jangan lakukan fetch
        if (!id || id === 'undefined') {
            console.error("ID Kategori tidak valid (undefined)");
            return;
        }
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Info Kategori Saat Ini
            const catRes = await getCategoryById(id);
            setCurrentCategory(catRes?.data?.category || catRes?.category);

            // 2. Ambil SUB-KATEGORI (Anaknya)
            const subRes = await getAllCategories({ parent_id: id });

            // Ekstraksi array yang aman (Mendukung berbagai format response)
            let subs = [];
            if (Array.isArray(subRes)) subs = subRes;
            else if (subRes?.data?.categories) subs = subRes.data.categories;
            else if (subRes?.categories) subs = subRes.categories;
            else if (subRes?.data) subs = subRes.data;

            setSubCategories(subs);

            // 3. Ambil PRODUK LANGSUNG
            const prodRes = await getAllProducts({ category_id: id });

            let prods = [];
            if (Array.isArray(prodRes)) prods = prodRes;
            else if (prodRes?.data?.products) prods = prodRes.data.products;
            else if (prodRes?.products) prods = prodRes.products;
            else if (prodRes?.data) prods = prodRes.data;

            setProducts(prods);

        } catch (err) {
            console.error("Error loading detail:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Memuat struktur kategori...</div>;
    if (!currentCategory) return <div className="p-10 text-center text-red-500">Kategori tidak ditemukan</div>;

    // Helper untuk mendapatkan ID (mendukung database lama/baru)
    const getCatId = (obj) => obj?.id || obj?.id_kategori;
    const getCatName = (obj) => obj?.name || obj?.nama_kategori;

    return (
        <div className="space-y-8 pb-10">
            {/* Header Breadcrumb & Title */}
            <div className="flex items-start gap-4 border-b border-gray-200 pb-6">
                <button onClick={() => navigate(-1)} className="mt-1 p-2 hover:bg-gray-100 rounded-full transition-colors" title="Kembali">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="cursor-pointer hover:text-blue-600" onClick={() => navigate('/categories')}>Kategori Utama</span>
                        {currentCategory.parent_name && (
                            <>
                                <ChevronRight className="w-3 h-3" />
                                <span>{currentCategory.parent_name}</span>
                            </>
                        )}
                        <ChevronRight className="w-3 h-3" />
                        <span className="font-semibold text-blue-600">{getCatName(currentCategory)}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">{getCatName(currentCategory)}</h1>
                    <p className="text-gray-500 mt-1">ID: #{getCatId(currentCategory)} • {currentCategory.parent_id ? 'Sub-Kategori' : 'Root Kategori'}</p>
                </div>
            </div>

            {/* --- BAGIAN 1: SUB-KATEGORI --- */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-500" />
                    Sub-Kategori ({subCategories.length})
                </h2>

                {subCategories.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subCategories.map((sub, idx) => (
                            <Link
                                key={getCatId(sub) || idx}
                                to={`/categories/${getCatId(sub)}`}
                                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Folder className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 group-hover:text-blue-700">{getCatName(sub)}</h4>
                                        <p className="text-xs text-gray-500">{sub.products_count || 0} Produk Langsung</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-gray-500 text-sm">
                        Tidak ada sub-kategori di dalam {getCatName(currentCategory)}.
                    </div>
                )}
            </div>

            {/* --- BAGIAN 2: DAFTAR PRODUK (LANGSUNG) --- */}
            <div className="space-y-4 pt-4">
                <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-500" />
                    Produk dalam Kategori Ini ({products.length})
                </h2>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3">Nama Produk</th>
                                    <th className="px-6 py-3">Harga</th>
                                    <th className="px-6 py-3">Stok</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-500">
                                            Belum ada produk yang ditambahkan langsung ke kategori ini.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((prod, idx) => (
                                        <tr key={prod.id || prod.id_produk || idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 font-medium text-gray-800 flex items-center gap-2">
                                                <Tag className="w-3 h-3 text-gray-400" />
                                                {prod.name || prod.nama_produk}
                                            </td>
                                            <td className="px-6 py-3 text-gray-600">
                                                {formatRupiah(prod.harga || 0)}
                                            </td>
                                            <td className="px-6 py-3 font-medium">{prod.stok ?? 100}</td>
                                            <td className="px-6 py-3">
                                                <Badge type={(prod.stok ?? 100) > 0 ? 'success' : 'danger'}>
                                                    {(prod.stok ?? 100) > 0 ? 'Tersedia' : 'Habis'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default CategoryDetail;