import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft,
    Printer,
    Download,
    Eye,
    FileText,
    User,
    Tag,
    Image as ImageIcon,
    Loader2,
    Mail,
    ShoppingBag,
    FileSearch,
    Hammer // Menambahkan icon palu untuk Jasa Pasang
} from 'lucide-react';

/**
 * Komponen Badge Internal
 */
const Badge = ({ children, type = 'info' }) => {
    const styles = {
        success: 'bg-green-100 text-green-700 border-green-200',
        warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        info: 'bg-blue-100 text-blue-700 border-blue-200',
        danger: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
        <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${styles[type] || styles.info}`}>
            {children}
        </span>
    );
};

/**
 * Fungsi Helper Formatter
 */
const formatRupiah = (number) => {
    const val = Number(number);
    if (isNaN(val) || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(val);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const TransactionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trx, setTrx] = useState(null);
    const [loading, setLoading] = useState(true);

    const componentRef = useRef(null);

    /**
     * Menggunakan fungsi cetak bawaan browser
     */
    const handlePrint = () => {
        window.print();
    };

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`http://localhost:5000/api/transactions/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = response.data?.data?.transaction || response.data?.transaction || response.data;
                setTrx(data);
            } catch (error) {
                console.error("Gagal ambil detail transaksi", error);
                if (error.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, navigate]);

    // Helper URL untuk aset (Foto Produk & Desain)
    const getAssetUrl = (filePath, isLaravel = true) => {
        if (!filePath) return null;
        if (filePath.startsWith('http')) return filePath;

        const port = isLaravel ? '8000' : '5000';
        const cleanPath = filePath.replace('public/', '');
        return `http://localhost:${port}/storage/${cleanPath}`;
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-gray-500">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="font-black uppercase tracking-widest text-xs">Menyelaraskan Data Transaksi...</p>
        </div>
    );

    if (!trx) return (
        <div className="p-20 text-center text-red-500 font-bold border-2 border-dashed border-red-100 rounded-[2.5rem] bg-red-50/30">
            ⚠️ Transaksi tidak ditemukan atau telah dihapus.
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* CSS KHUSUS PRINT */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-section, .print-section * {
                        visibility: visible;
                    }
                    .print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        display: block !important;
                    }
                    @page {
                        margin: 1cm;
                    }
                }
            `}} />

            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button onClick={() => navigate('/transactions')} className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all shadow-sm group">
                        <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">Rincian Order</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                            <ShoppingBag className="w-3 h-3" /> {trx.order_code || `#${trx.id_transaksi}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex cursor-pointer items-center gap-3 px-8 py-3.5 bg-gray-900 text-white rounded-2xl hover:bg-blue-600 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-gray-200 active:scale-95"
                    >
                        <Printer className="w-4 h-4" /> Cetak Invoice
                    </button>
                    <Badge type={['Paid', 'Success', 'Lunas', 'paid'].includes(trx.status_pembayaran?.toLowerCase()) ? 'success' : 'warning'}>
                        {trx.status_pembayaran}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* KOLOM KIRI: PRODUK & RINCIAN BIAYA */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex justify-between items-center">
                            <h3 className="font-black text-gray-800 flex items-center gap-3 uppercase tracking-tighter">
                                <Tag className="w-5 h-5 text-blue-500" /> Item & Spesifikasi
                            </h3>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {formatDate(trx.tanggal_transaksi)}
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 text-gray-400 text-[10px] uppercase tracking-widest font-black border-b border-gray-100">
                                    <tr>
                                        <th className="px-8 py-5">Produk</th>
                                        <th className="px-6 py-5 text-center">Harga</th>
                                        <th className="px-6 py-5 text-center">Qty</th>
                                        <th className="px-8 py-5 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(trx.items || [])?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/30 transition-all group">
                                            <td className="px-8 py-8">
                                                <div className="flex gap-5">
                                                    {/* FOTO PRODUK */}
                                                    <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 flex-shrink-0 overflow-hidden shadow-inner">
                                                        {item.product_image ? (
                                                            <img
                                                                src={getAssetUrl(item.product_image, true)}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                                alt={item.product_name}
                                                                onError={(e) => { e.target.src = 'https://placehold.co/200x200?text=No+Image'; }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <ImageIcon className="w-8 h-8" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1">
                                                        <p className="font-black text-gray-900 uppercase tracking-tight text-base leading-none mb-2">
                                                            {item.product_name || item.nama_produk}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                                                            {item.material} • {item.size} • {item.finishing}
                                                        </p>

                                                        {/* INFO DESAIN & FILE */}
                                                        <div className="mt-4 flex flex-col gap-2">
                                                            <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl max-w-sm">
                                                                <FileText className="w-4 h-4 text-blue-400" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest truncate">
                                                                        Desain: {String(item.design_option || 'TIM_KAMI').replace('_', ' ')}
                                                                    </p>
                                                                    {item.design_file && (
                                                                        <div className="flex gap-3 mt-1">
                                                                            <button onClick={() => window.open(getAssetUrl(item.design_file, true), '_blank')} className="text-[9px] font-black text-gray-500 uppercase hover:text-blue-600 transition-colors flex items-center gap-1">
                                                                                <Eye className="w-3 h-3" /> Lihat
                                                                            </button>
                                                                            <a href={getAssetUrl(item.design_file, true)} download className="text-[9px] font-black text-gray-500 uppercase hover:text-blue-600 transition-colors flex items-center gap-1">
                                                                                <Download className="w-3 h-3" /> Unduh
                                                                            </a>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* RINCIAN BIAYA JASA DESAIN */}
                                                            {Number(item.design_cost) > 0 && (
                                                                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl max-w-sm">
                                                                    <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">
                                                                        Biaya Jasa {item.design_difficulty}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-red-700">
                                                                        + {formatRupiah(item.design_cost)}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* [TAMBAHAN BARU] RINCIAN BIAYA JASA PASANG */}
                                                            {Number(item.need_installation) === 1 && (
                                                                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-xl max-w-sm">
                                                                    <span className="text-[9px] font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                                                                        <Hammer className="w-3 h-3" /> Layanan Pemasangan
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-green-700">
                                                                        + {formatRupiah(item.installation_price)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-8 text-sm text-center text-gray-600 font-bold">
                                                {formatRupiah(item.harga_satuan || item.price || 0)}
                                            </td>
                                            <td className="px-6 py-8 text-sm font-black text-center text-gray-900">
                                                {item.jumlah || item.quantity || 0}
                                            </td>
                                            <td className="px-8 py-8 text-right font-black text-blue-600 text-lg tracking-tighter">
                                                {formatRupiah(item.subtotal || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* RINGKASAN BIAYA AKHIR */}
                        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                            <div className="w-full max-w-xs space-y-3">
                                <div className="flex justify-between text-xs text-gray-400 font-bold uppercase tracking-widest">
                                    <span>Total Penjualan</span>
                                    <span className="text-gray-900">{formatRupiah(trx.total_harga)}</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black text-gray-900 border-t border-gray-200 pt-4 uppercase tracking-tighter">
                                    <span>Total Bayar</span>
                                    <span className="text-blue-600">{formatRupiah(trx.total_harga)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KOLOM KANAN: INFO PELANGGAN & CATATAN */}
                <div className="space-y-6">
                    {/* INFO PELANGGAN */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                        <h3 className="font-black text-gray-900 uppercase tracking-tighter mb-8 flex items-center gap-3 border-b border-gray-50 pb-5">
                            <User className="w-5 h-5 text-blue-500" /> Profil Pelanggan
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nama Lengkap</label>
                                <p className="font-black text-gray-900 text-lg leading-tight uppercase">{trx.nama_pelanggan || 'Guest'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <label className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Email Address</label>
                                    <p className="text-gray-600 font-bold text-sm truncate">{trx.email_pelanggan || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CATATAN PESANAN (DESKRIPSI DARI CHECKOUT) */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                        <h3 className="font-black text-gray-900 uppercase tracking-tighter mb-6 flex items-center gap-3 border-b border-gray-50 pb-5">
                            <FileSearch className="w-5 h-5 text-orange-500" /> Catatan Pesanan
                        </h3>
                        <div className="bg-orange-50/50 p-5 rounded-2xl border border-orange-100">
                            <p className="text-sm text-gray-700 text-[13px] leading-relaxed font-medium italic">
                                {trx.notes ? `"${trx.notes}"` : 'Tidak ada catatan khusus dari pelanggan untuk pesanan ini.'}
                            </p>
                        </div>
                    </div>

                    {/* PEMBAYARAN GATEWAY */}
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] shadow-xl shadow-blue-100 p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="font-black uppercase tracking-tighter text-lg mb-2">Midtrans Gateway</h4>
                            <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-8">Verifikasi Pembayaran Otomatis</p>
                            <div className="bg-white/10 backdrop-blur-md p-5 rounded-3xl border border-white/20">
                                <p className="text-[9px] uppercase font-black text-blue-200 tracking-widest mb-1">Status Saat Ini</p>
                                <p className="text-3xl font-black uppercase tracking-tighter">{trx.status_pembayaran}</p>
                            </div>
                        </div>
                        <ShoppingBag className="absolute -bottom-6 -right-6 w-32 h-32 text-white opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                </div>
            </div>

            {/* --- INVOICE TERSEMBUNYI UNTUK PRINT --- */}
            <div className="print-section" style={{ display: 'none' }}>
                <div ref={componentRef} style={{ padding: '50px', fontFamily: 'sans-serif', color: '#111' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #111', paddingBottom: '20px', marginBottom: '30px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {/* LOGO PERUSAHAAN */}
                            <img
                                src="/logo.png"
                                alt="Logo CV Anugrah"
                                style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
                            />
                            <div>
                                <h1 style={{ fontSize: '32px', margin: 0, fontWeight: '900' }}>CV. ANUGRAH</h1>
                                <p style={{ fontSize: '12px', margin: '5px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Digital Printing & Advertising</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '24px', margin: 0, color: '#666' }}>INVOICE</h2>
                            <p style={{ fontWeight: 'bold' }}>{trx.order_code}</p>
                        </div>
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', color: '#666' }}>Ditujukan Kepada:</p>
                        <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{trx.nama_pelanggan}</p>
                        <p style={{ margin: 0 }}>{trx.email_pelanggan}</p>
                        <p style={{ margin: '20px 0 0 0', fontSize: '12px' }}>Tanggal: {formatDate(trx.tanggal_transaksi)}</p>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #111' }}>
                                <th style={{ textAlign: 'left', padding: '10px' }}>Item Deskripsi</th>
                                <th style={{ textAlign: 'center', padding: '10px' }}>Harga</th>
                                <th style={{ textAlign: 'center', padding: '10px' }}>Qty</th>
                                <th style={{ textAlign: 'right', padding: '10px' }}>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trx.items?.map((item, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '15px 10px' }}>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>{item.product_name}</p>
                                        <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>{item.material} | {item.size}</p>
                                        {Number(item.design_cost) > 0 && (
                                            <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: '#e11d48' }}>+ Jasa Desain {item.design_difficulty} ({formatRupiah(item.design_cost)})</p>
                                        )}
                                        {/* [TAMBAHAN BARU] BARIS JASA PASANG DI STRUK CETAK */}
                                        {Number(item.need_installation) === 1 && (
                                            <p style={{ margin: '5px 0 0 0', fontSize: '10px', color: '#16a34a', fontWeight: 'bold' }}>+ Layanan Pemasangan ({formatRupiah(item.installation_price)})</p>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{formatRupiah(item.harga_satuan)}</td>
                                    <td style={{ textAlign: 'center' }}>{item.jumlah}</td>
                                    <td style={{ textAlign: 'right' }}>{formatRupiah(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ width: '250px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #111', paddingTop: '15px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>TOTAL</span>
                                <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{formatRupiah(trx.total_harga)}</span>
                            </div>
                        </div>
                    </div>

                    {/* --- BAGIAN TANDA TANGAN (Hanya muncul saat print) --- */}
                    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'flex-end', textAlign: 'center' }}>
                        <div style={{ width: '200px' }}>
                            <p style={{ margin: 0, fontSize: '12px' }}>Hormat Kami,</p>
                            {/* Pastikan file ttd.png ada di folder public/ */}
                            <img
                                src="/ttd.png"
                                alt="Tanda Tangan"
                                style={{ height: '80px', width: 'auto', margin: '10px 0', objectFit: 'contain' }}
                            />
                            <p style={{ margin: 0, fontWeight: 'bold', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                                ( CV. ANUGRAH )
                            </p>
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                        <p>Terima kasih atas pesanan Anda. Status: <strong>{trx.status_pembayaran?.toUpperCase()}</strong></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetail;