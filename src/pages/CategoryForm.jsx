import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createCategory, updateCategory, getCategoryById, getAllCategories } from '../api/categories';
import { ArrowLeft, Save, Image as ImageIcon, Trash2, Layers, Loader2 } from 'lucide-react';
import { showSuccess, showError, showLoading, closeAlert } from '../utils/alert';

const CategoryForm = () => {
    const { id } = useParams(); // Jika ada ID, berarti Mode Edit
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        nama_kategori: '',
        parent_id: '',
        gambar: null
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [allCategories, setAllCategories] = useState([]); // Untuk dropdown parent
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode); // Loading saat ambil data awal

    useEffect(() => {
        const initForm = async () => {
            // 1. Ambil opsi parent dulu untuk dropdown
            await fetchParentOptions();

            // 2. Jika mode edit, ambil data kategori yang akan diubah
            if (isEditMode) {
                await fetchCategoryData();
            }
            setInitialLoading(false);
        };

        initForm();
    }, [id]);

    // Ambil semua kategori untuk opsi Parent
    const fetchParentOptions = async () => {
        try {
            const res = await getAllCategories();
            const data = res?.data?.categories || res?.categories || [];
            setAllCategories(data);
        } catch (err) {
            console.error("Gagal load opsi kategori:", err);
        }
    };

    // Ambil data kategori saat ini (Mode Edit)
    const fetchCategoryData = async () => {
        try {
            const res = await getCategoryById(id);
            const category = res?.data?.category || res?.category;

            if (category) {
                // SET FORM DATA DARI DATA ASLI (Mendukung mapping lama & baru)
                setFormData({
                    nama_kategori: category.nama_kategori || category.name || '',
                    // parent_id diset sebagai string agar sesuai dengan value dropdown
                    parent_id: category.parent_id !== null ? String(category.parent_id) : '',
                    gambar: null
                });

                // SET PREVIEW GAMBAR (Gunakan URL dari backend)
                if (category.gambar_url) {
                    setPreviewImage(category.gambar_url);
                } else if (category.gambar || category.image) {
                    const imgPath = category.gambar || category.image;
                    // Gunakan localhost:5000 (backend) untuk preview jika path relatif
                    setPreviewImage(`http://localhost:5000${imgPath.startsWith('/') ? '' : '/'}${imgPath}`);
                }
            }
        } catch (err) {
            console.error("Error loading category:", err);
            showError("Error", "Gagal memuat data kategori.");
            navigate('/categories');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showError("File Terlalu Besar", "Ukuran gambar maksimal 2MB");
                return;
            }
            setFormData(prev => ({ ...prev, gambar: file }));
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        showLoading(isEditMode ? 'Memperbarui kategori...' : 'Menyimpan kategori...');

        try {
            const data = new FormData();
            data.append('nama_kategori', formData.nama_kategori);
            data.append('parent_id', formData.parent_id);

            if (formData.gambar) {
                data.append('gambar', formData.gambar);
            }

            if (isEditMode) {
                await updateCategory(id, data);
                closeAlert();
                await showSuccess("Berhasil", "Kategori berhasil diperbarui.");
            } else {
                await createCategory(data);
                closeAlert();
                await showSuccess("Berhasil", "Kategori baru berhasil ditambahkan.");
            }
            navigate('/categories');
        } catch (err) {
            closeAlert();
            console.error(err);
            showError("Gagal", err.response?.data?.message || "Terjadi kesalahan saat menyimpan.");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500 w-full">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-2" />
                <p>Memuat data kategori...</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/categories')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    {isEditMode ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* KOLOM KIRI: INPUT DATA (Membesar menjadi 3/4 lebar di layar besar) */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-5">
                        <h3 className="font-semibold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-500" /> Informasi Kategori
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                                <input
                                    type="text"
                                    name="nama_kategori"
                                    required
                                    placeholder="Contoh: Banner, Stiker, Undangan..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.nama_kategori}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Induk Kategori (Opsional)</label>
                                <select
                                    name="parent_id"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all"
                                    value={formData.parent_id}
                                    onChange={handleChange}
                                >
                                    <option value="">-- Jadikan Kategori Utama (Root) --</option>
                                    {allCategories
                                        .filter(c => {
                                            const catId = c.id || c.id_kategori;
                                            return parseInt(catId) !== parseInt(id); // Cegah memilih diri sendiri sebagai parent
                                        })
                                        .map(cat => (
                                            <option key={cat.id || cat.id_kategori} value={cat.id || cat.id_kategori}>
                                                {cat.nama_kategori || cat.name}
                                            </option>
                                        ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Pilih kategori lain jika ingin membuat sub-kategori (misal: "Banner Indoor" induknya "Banner").
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => navigate('/categories')}
                            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-10 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-100 transition-colors"
                        >
                            {loading ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan Kategori</>}
                        </button>
                    </div>
                </div>

                {/* KOLOM KANAN: UPLOAD GAMBAR (Membesar/Tetap di layar besar) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
                        <h3 className="font-semibold text-gray-800 mb-4">Gambar Kategori</h3>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors bg-gray-50/50 relative min-h-[250px] lg:h-[calc(100%-3rem)] group">
                            {previewImage ? (
                                <div className="relative w-full h-full min-h-[200px] flex items-center justify-center">
                                    <img src={previewImage} alt="Preview" className="max-w-full max-h-[300px] object-contain rounded-lg" />
                                    <button
                                        type="button"
                                        onClick={() => { setPreviewImage(null); setFormData(p => ({ ...p, gambar: null })) }}
                                        className="absolute top-2 right-2 bg-white text-red-600 p-1.5 rounded-full shadow hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                        title="Hapus Gambar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-3 bg-blue-100 rounded-full mb-2 text-blue-600">
                                        <ImageIcon className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs text-gray-500">Upload Foto (Opsional)</p>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer ${previewImage ? 'pointer-events-none' : ''}`}
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
};

export default CategoryForm;