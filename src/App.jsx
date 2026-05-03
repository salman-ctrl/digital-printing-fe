import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Predictions from './pages/Predictions';

import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import ProductDetail from './pages/ProductDetail';

import Categories from './pages/Categories';
import CategoryForm from './pages/CategoryForm';
import CategoryDetail from './pages/CategoryDetail';

import Transactions from './pages/Transactions';
import HistoryData from './pages/HistoryData';

import TransactionDetail from './pages/TransactionDetail';

import Customers from './pages/Customers';
import NotFound from './pages/NotFound';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppWithRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}

const AppWithRouter = () => {
  const { user } = useAuth();
  const userRole = (user?.role || user?.user?.role)?.toLowerCase();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        {/* Owner ke Dashboard, Admin ke Kategori */}
        <Route index element={
          userRole === 'owner'
            ? <Dashboard />
            : <Navigate to="/categories" replace />
        } />

        {/* Hanya Owner */}
        <Route path="predictions" element={
          userRole === 'owner'
            ? <Predictions />
            : <Navigate to="/categories" replace />
        } />

        {/* Hanya Owner */}
        <Route path="transactions" element={
          userRole === 'owner'
            ? <Transactions />
            : <Navigate to="/categories" replace />
        } />
        <Route path="transactions/:id" element={
          userRole === 'owner'
            ? <TransactionDetail />
            : <Navigate to="/categories" replace />
        } />

        <Route path="history-data" element={
          userRole === 'owner'
            ? <HistoryData />
            : <Navigate to="/categories" replace />
        } />

        {/* Owner + Admin */}
        <Route path="products" element={<Products />} />
        <Route path="products/create" element={<ProductForm />} />
        <Route path="products/edit/:id" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductDetail />} />

        <Route path="categories" element={<Categories />} />
        <Route path="categories/create" element={<CategoryForm />} />
        <Route path="categories/edit/:id" element={<CategoryForm />} />
        <Route path="categories/:id" element={<CategoryDetail />} />

        <Route path="customers" element={<Customers />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;