import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Tetap */}
      <Sidebar />
      
      {/* Konten Utama di sebelah kanan */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <Navbar />
        
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;