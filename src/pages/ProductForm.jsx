import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProduct, updateProduct, getProductById, getProductCategories } from '../api/products';
import client from '../api/client';
import { ArrowLeft, Save, Image as ImageIcon, Trash2, Plus, Info, Hammer } from 'lucide-react';
import { showSuccess, showError, showConfirm, showLoading, closeAlert } from '../utils/alert';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        nama_produk: '',
        id_kategori: '',
        harga: '',
        stok: '',
        deskripsi: '',
        gambar: null,
        installation_available: 0,
        installation_price: ''
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);

    const [allCategories, setAllCategories] = useState([]);
    const [selectedParent, setSelectedParent] = useState('');

    const [loading, setLoading] = useState(false);


    const parentCategories = useMemo(() => {
        return allCategories.filter(c => !c.parent_id);
    }, [allCategories]);

    const subCategories = useMemo(() => {
        if (!selectedParent) return [];
        return allCategories.filter(c => c.parent_id === parseInt(selectedParent));
    }, [allCategories, selectedParent]);


    useEffect(() => {
        const init = async () => {
            await fetchCategories();
            if (isEditMode) {
                await fetchProductData();
            }
        };
        init();
    }, [id]);

    const fetchCategories = async () => {
        try {
            const res = await getProductCategories();
            const cats = res?.data?.categories || res?.categories || [];
            setAllCategories(cats);
        } catch (err) {
            console.error("Gagal load kategori:", err);
            showError("Error", "Gagal memuat data kategori.");
        }
    };

    const fetchProductData = async () => {
        try {
            setLoading(true);
            const res = await getProductById(id);
            const product = res?.data?.product || res?.product;

            if (product) {
                let parentId = '';
                let finalId = product.id_kategori;

                const currentCat = allCategories.find(c => c.id_kategori === product.id_kategori) ||
                    (await getProductCategories())?.data?.categories?.find(c => c.id_kategori === product.id_kategori);

                if (currentCat) {
                    if (currentCat.parent_id) {
                        parentId = currentCat.parent_id;
                    } else {
                        parentId = currentCat.id_kategori;
                    }
                }

                setSelectedParent(parentId);

                setFormData({
                    nama_produk: product.nama_produk || product.name,
                    id_kategori: finalId,
                    harga: product.harga,
                    stok: product.stok,
                    deskripsi: product.deskripsi || product.description || '',
                    gambar: null,
                    installation_available: product.installation_available || 0,
                    installation_price: product.installation_price || ''
                });

                if (product.gambar_url || product.image_primary) setPreviewImage(product.gambar_url || product.image_primary);

                if (product.galeri && Array.isArray(product.galeri)) {
                    const oldGallery = product.galeri.map(g => ({
                        id: g.id_foto || g.id,
                        url: g.url || g.photo_url,
                        isOld: true
                    }));
                    setGalleryPreviews(oldGallery);
                }
            }
        } catch (err) {
            showError("Error", "Gagal memuat data produk.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };


    const handleParentChange = (e) => {
        const newParentId = e.target.value;
        setSelectedParent(newParentId);

        setFormData(prev => ({ ...prev, id_kategori: newParentId }));
    };

    const handleSubChange = (e) => {
        const newSubId = e.target.value;
        setFormData(prev => ({ ...prev, id_kategori: newSubId || selectedParent }));
    };


    const handleMainFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showError("File Terlalu Besar", "Ukuran foto maksimal 2MB");
                return;
            }
            setFormData(prev => ({ ...prev, gambar: file }));
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);

        if (galleryPreviews.length + files.length > 5) {
            showError("Batas Tercapai", "Maksimal total 5 foto galeri.");
            return;
        }

        if (files.length > 0) {
            setGalleryFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => ({
                url: URL.createObjectURL(file),
                fileObj: file,
                isOld: false
            }));
            setGalleryPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeGalleryItem = async (index, item) => {
        if (item.isOld) {
            const isConfirmed = await showConfirm(
                "Hapus Foto?",
                "Foto ini akan dihapus permanen dari database.",
                "Ya, Hapus"
            );

            if (isConfirmed) {
                try {
                    showLoading("Menghapus foto...");
                    await client.delete(`/products/gallery/${item.id}`);
                    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
                    closeAlert();
                    showSuccess("Berhasil", "Foto dihapus.");
                } catch (err) {
                    closeAlert();
                    showError("Gagal", "Gagal menghapus foto galeri.");
                }
            }
        } else {
            setGalleryFiles(prev => prev.filter(f => f !== item.fileObj));
            setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.id_kategori) {
            showError("Validasi", "Mohon pilih kategori produk.");
            return;
        }

        setLoading(true);
        showLoading(isEditMode ? 'Memperbarui produk...' : 'Menyimpan produk...');

        try {
            const data = new FormData();
            data.append('nama_produk', formData.nama_produk);
            data.append('id_kategori', formData.id_kategori);
            data.append('harga', formData.harga);
            data.append('stok', formData.stok);
            data.append('deskripsi', formData.deskripsi);
            data.append('installation_available', formData.installation_available);
            data.append('installation_price', formData.installation_available ? formData.installation_price : 0);

            if (formData.gambar) {
                data.append('gambar', formData.gambar);
            }

            galleryFiles.forEach((file) => {
                data.append('galeri', file);
            });

            if (isEditMode) {
                await updateProduct(id, data);
                closeAlert();
                await showSuccess("Berhasil", "Produk berhasil diperbarui.");
            } else {
                await createProduct(data);
                closeAlert();
                await showSuccess("Berhasil", "Produk berhasil ditambahkan.");
            }
            navigate('/products');
        } catch (err) {
            closeAlert();
            console.error(err);
            showError("Gagal", err.response?.data?.message || "Terjadi kesalahan saat menyimpan produk.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-10">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/products')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    {isEditMode ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                        <h3 className="font-semibold text-gray-800 border-b pb-3 mb-4">Informasi Dasar</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                            <input type="text" name="nama_produk" required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.nama_produk} onChange={handleChange} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Utama</label>
                                <select
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                                    value={selectedParent}
                                    onChange={handleParentChange}
                                >
                                    <option value="">-- Pilih Kategori --</option>
                                    {parentCategories.map(cat => (
                                        <option key={cat.id_kategori} value={cat.id_kategori}>{cat.nama_kategori}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sub Kategori</label>
                                <div className="relative">
                                    <select
                                        className={`w-full px-4 py-2 border border-gray-300 rounded-lg outline-none bg-white transition-all ${!selectedParent ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`}
                                        value={formData.id_kategori === selectedParent ? '' : formData.id_kategori}
                                        onChange={handleSubChange}
                                        disabled={!selectedParent}
                                    >
                                        <option value="">-- Pilih Sub Kategori --</option>
                                        {subCategories.map(cat => (
                                            <option key={cat.id_kategori} value={cat.id_kategori}>{cat.nama_kategori}</option>
                                        ))}
                                    </select>
                                </div>
                                {selectedParent && subCategories.length === 0 && (
                                    <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                                        <Info className="w-3 h-3" /> Kategori ini belum mempunyai sub kategori.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                                <input type="number" name="harga" required min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.harga} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                                <input type="number" name="stok" required min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.stok} onChange={handleChange} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                            <textarea name="deskripsi" rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={formData.deskripsi} onChange={handleChange}></textarea>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Hammer className="w-5 h-5 text-blue-500" /> Layanan Tambahan
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="installation_available"
                                        name="installation_available"
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={formData.installation_available === 1}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="installation_available" className="text-sm font-medium text-gray-700 cursor-pointer">
                                        Aktifkan Opsi Jasa Pemasangan
                                    </label>
                                </div>

                                <div className={`transition-all duration-300 ${formData.installation_available ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Biaya Pasang (Rp)</label>
                                    <input
                                        type="number"
                                        name="installation_price"
                                        placeholder="Contoh: 50000"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                                        value={formData.installation_price}
                                        onChange={handleChange}
                                        required={formData.installation_available === 1}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 ml-1 italic">
                                        *Biaya ini akan muncul sebagai pilihan opsional bagi pelanggan saat checkout.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-800 mb-4 flex justify-between">
                            Thumbnail Produk
                            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded">Wajib</span>
                        </h3>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors bg-gray-50/50 relative min-h-[200px]">
                            {previewImage ? (
                                <div className="relative w-full h-48 group">
                                    <img src={previewImage} alt="Main" className="w-full h-full object-contain rounded-lg" />
                                    <button type="button" onClick={() => { setPreviewImage(null); setFormData(p => ({ ...p, gambar: null })) }} className="absolute top-2 right-2 bg-white text-red-600 p-1.5 rounded-full shadow hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-3 bg-blue-100 rounded-full mb-2 text-blue-600"><ImageIcon className="w-6 h-6" /></div>
                                    <p className="text-xs text-gray-500">Upload Foto Utama</p>
                                </>
                            )}
                            <input type="file" accept="image/*" className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${previewImage ? 'pointer-events-none' : ''}`} onChange={handleMainFileChange} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-800 mb-4 flex justify-between">
                            Galeri Foto
                            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded">Opsional</span>
                        </h3>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {galleryPreviews.map((item, idx) => (
                                <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden group bg-gray-50">
                                    <img src={item.url} alt={`Galeri ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryItem(idx, item)}
                                        className="absolute top-1 right-1 bg-white/90 text-red-600 p-1 rounded-full shadow hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}

                            {galleryPreviews.length < 5 && (
                                <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-gray-50 cursor-pointer relative transition-colors text-gray-400 hover:text-blue-500 hover:border-blue-300">
                                    <Plus className="w-6 h-6 mb-1" />
                                    <span className="text-xs">Tambah</span>
                                    <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleGalleryChange} />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-400">Maksimal 5 foto tambahan.</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => navigate('/products')} className="flex-1 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">Batal</button>
                        <button type="submit" disabled={loading} className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-200 transition-colors">
                            {loading ? <span className="animate-spin">⏳</span> : <Save className="w-4 h-4" />} Simpan
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default ProductForm;