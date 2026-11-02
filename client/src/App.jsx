import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Parties from './pages/Parties';
import Orders from './pages/orders';
import OrderForm from './pages/OrderForm';
import OrderView from './pages/OrderView';
import Inventory from './pages/Inventory';
import Users from './pages/Users';

function Home() {
  const { user } = useAuth();
  const to = { admin: '/dashboard', sales: '/orders/sale', store: '/orders/purchase' }[user.role];
  return <Navigate to={to || '/products'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<ProtectedRoute roles={['admin']}><Dashboard /></ProtectedRoute>} />
        <Route path="products" element={<Products />} />
        <Route path="parties" element={<Parties />} />
        <Route path="orders/:type" element={<Orders />} />
        <Route path="orders/:type/new" element={<OrderForm />} />
        <Route path="order/:id" element={<OrderView />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}