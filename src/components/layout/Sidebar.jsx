import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['owner'] },
    { path: '/transactions', icon: ShoppingCart, label: 'Transaksi', roles: ['owner'] },
    { path: '/categories', icon: Package, label: 'Kategori', roles: ['owner', 'admin'] },
    { path: '/products', icon: Package, label: 'Produk', roles: ['owner', 'admin'] },
    { path: '/customers', icon: Users, label: 'Pelanggan', roles: ['owner', 'admin'] },
  ];

  const isActive = (path) => location.pathname === path;

  const currentRole = (user?.role || user?.user?.role || user?.data?.role)?.toLowerCase() ?? 'user';

  const filteredMenu = menuItems.filter(item =>
    item.roles.includes(currentRole)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 z-50">
      <div className="flex h-24 items-center justify-center border-b border-gray-200 px-4">
        <img
          src="/logo.png"
          alt="Logo"
          className="h-20 w-auto object-contain"
        />
      </div>

      <nav className="p-4 space-y-2">
        {filteredMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)
              ? 'bg-blue-50 text-blue-600 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        ))}

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg mt-8 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;