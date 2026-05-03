import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, User, ShoppingBag, Clock, CheckCircle2 } from 'lucide-react';
import { getAllTransactions } from '../../api/transactions';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem('read_notification_ids');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchNotifications = async () => {
    try {
      const response = await getAllTransactions();
      const allTrx = response?.data?.transactions || response?.transactions || [];

      const pendingTrx = allTrx.filter(t =>
        ['Unpaid', 'Pending', 'pending'].includes(t.status_pembayaran)
      );

      const count = pendingTrx.filter(t => !readIds.includes(t.id_transaksi)).length;

      setNotifications(pendingTrx.slice(0, 8));
      setUnreadCount(count);
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
    }
  };

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const updatedReadIds = [...readIds, id];
      setReadIds(updatedReadIds);
      localStorage.setItem('read_notification_ids', JSON.stringify(updatedReadIds));

      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setShowDropdown(false);
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id_transaksi);
    const updatedReadIds = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updatedReadIds);
    localStorage.setItem('read_notification_ids', JSON.stringify(updatedReadIds));
    setUnreadCount(0);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [readIds]);

  return (
    <header className="h-24 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
      <div>
        <h2 className="text-xl font-black text-gray-800 tracking-tighter uppercase">
          <span className="text-blue-600">Murni Digital Printing</span>
        </h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Sistem Kontrol Pendapatan</p>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`relative p-2.5 rounded-xl transition-all duration-300 ${showDropdown ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-100'
              }`}
          >
            <Bell className="w-5 h-5" />

            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
              <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-20 overflow-hidden transform origin-top-right transition-all duration-500 animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                  <div>
                    <h4 className="font-black text-xs text-gray-800 uppercase tracking-widest">Aktivitas Pesanan</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{unreadCount} Pesanan belum dilihat</p>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-full transition-colors"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Baca Semua
                    </button>
                  )}
                </div>

                <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((trx) => {
                      const isRead = readIds.includes(trx.id_transaksi);
                      return (
                        <Link
                          key={trx.id_transaksi}
                          to={`/transactions/${trx.id_transaksi}`}
                          onClick={() => markAsRead(trx.id_transaksi)}
                          className={`p-5 border-b border-gray-50 flex gap-4 transition-all group ${isRead ? 'opacity-60 grayscale-[0.5]' : 'bg-blue-50/30'
                            } hover:bg-blue-50`}
                        >
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all shadow-sm ${isRead ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6'
                            }`}>
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <p className={`text-sm font-black truncate uppercase tracking-tight ${isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                                {trx.nama_pelanggan}
                              </p>
                              {!isRead && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {trx.order_code || `#${trx.id_transaksi}`}
                              </p>
                              <p className={`text-xs font-black ${isRead ? 'text-gray-400' : 'text-blue-600'}`}>
                                Rp {trx.total_harga?.toLocaleString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="p-16 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                        <Bell className="w-8 h-8 text-gray-200" />
                      </div>
                      <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest">Hening Sekali...</h5>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">Tidak ada pesanan tertunda saat ini.</p>
                    </div>
                  )}
                </div>

                <Link
                  to="/transactions"
                  onClick={() => setShowDropdown(false)}
                  className="block p-4 text-center text-[10px] font-black text-gray-400 hover:text-blue-600 hover:bg-gray-50 transition-all border-t border-gray-50 uppercase tracking-[0.2em]"
                >
                  Lihat Riwayat Lengkap
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 pl-5 border-l border-gray-100">
          <div className="text-right hidden md:block">
            <p className="text-xs font-black text-gray-900 leading-none uppercase tracking-tighter">{user?.name || 'Administrator'}</p>
            <p className="text-[9px] text-blue-500 uppercase font-black tracking-[0.2em] mt-1.5">{user?.role || 'Full Access'}</p>
          </div>
          <div className="w-11 h-11 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center text-white font-black shadow-xl shadow-gray-200 border-2 border-white transform hover:rotate-6 transition-transform cursor-pointer">
            {user?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;