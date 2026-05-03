import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById } from '../api/products';
import { ArrowLeft, Package, Layers, Calendar, Edit, Image as ImageIcon } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import Badge from '../components/common/Badge';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // State untuk gambar yang sedang aktif ditampilkan di kolom utama
    const [activeImage, setActiveImage] = useState(null);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await getProductById(id);
                const prodData = res?.data?.product || res?.product;
                setProduct(prodData);

                // Set gambar aktif pertama kali
                if (prodData) {
                    setActiveImage(prodData.gambar_url || prodData.gambar_utama || null);
                }
            } catch (error) {
                console.error("Gagal load detail:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return <div className="p-10 text-center">Memuat detail produk...</div>;
    if (!product) return <div className="p-10 text-center text-red-500">Produk tidak ditemukan.</div>;

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-800">{product.nama_produk}</h1>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                        ID: #{product.id_produk}
                        <span className="text-gray-300">|</span>
                        {product.nama_kategori}
                    </p>
                </div>
                <button
                    onClick={() => navigate(`/products/edit/${id}`)}
                    className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                    <Edit className="w-4 h-4" /> Edit Produk
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* KOLOM KIRI: GALERI GAMBAR */}
                <div className="space-y-4">
                    {/* Gambar Utama (Besar) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 h-fit">
                        <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden relative">
                            {activeImage ? (
                                <img src={activeImage} alt={product.nama_produk} className="w-full h-full object-contain transition-all duration-300" />
                            ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                    <Package className="w-16 h-16 mb-2" />
                                    <span className="text-sm">Tidak ada gambar</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thumbnail Galeri (Kecil) */}
                    {product.galeri && product.galeri.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                            {/* Tampilkan juga thumbnail utama agar bisa diklik balik */}
                            {product.gambar_url && (
                                <div
                                    onClick={() => setActiveImage(product.gambar_url)}
                                    className={`aspect-square rounded-lg border-2 cursor-pointer overflow-hidden ${activeImage === product.gambar_url ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent hover:border-gray-300'}`}
                                >
                                    <img src={product.gambar_url} className="w-full h-full object-cover" alt="Main" />
                                </div>
                            )}

                            {/* Mapping Galeri */}
                            {product.galeri.map((foto, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setActiveImage(foto.url)}
                                    className={`aspect-square rounded-lg border-2 cursor-pointer overflow-hidden ${activeImage === foto.url ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent hover:border-gray-300'}`}
                                >
                                    <img src={foto.url} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* KOLOM KANAN: INFORMASI DETAIL */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                            Informasi Produk
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                            <div className="space-y-1">
                                <span className="text-sm text-gray-500">Harga Satuan</span>
                                <p className="text-2xl font-bold text-blue-600">{formatRupiah(product.harga)}</p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-sm text-gray-500">Stok Tersedia</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-semibold text-gray-800">{product.stok}</span>
                                    <Badge type={product.stok > 10 ? 'success' : 'danger'}>
                                        {product.stok > 10 ? 'Stok Aman' : 'Stok Menipis'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-1 pt-4 border-t border-dashed border-gray-100 sm:col-span-2 grid sm:grid-cols-2 gap-6">
                                <div>
                                    <span className="text-sm text-gray-500 flex items-center gap-1 mb-1"><Layers className="w-3.5 h-3.5" /> Kategori</span>
                                    <p className="text-gray-800 font-medium">{product.nama_kategori || 'Umum'}</p>
                                </div>

                                <div>
                                    <span className="text-sm text-gray-500 flex items-center gap-1 mb-1"><Calendar className="w-3.5 h-3.5" /> Terakhir Update</span>
                                    <p className="text-gray-800 font-medium">
                                        {product.updated_at ? new Date(product.updated_at).toLocaleDateString('id-ID', {
                                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                        }) : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <span className="block text-sm font-medium text-gray-700 mb-3">Deskripsi Produk</span>
                            <div className="bg-gray-50 p-4 rounded-xl text-gray-600 text-sm leading-relaxed whitespace-pre-line border border-gray-100">
                                {product.deskripsi || "Tidak ada deskripsi untuk produk ini."}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;