import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Users from './pages/users/Users';
import Roles from './pages/roles/Roles';
import Permissions from './pages/permissions/Permissions';
import FrameLayers from './pages/posters/Posters';
import Settings from './pages/settings/Settings';
import Packages from './pages/subscriptions/Subscriptions';
import Customers from './pages/customers/Customers';
import CustomerDetails from './pages/customers/CustomerDetails';
import Categories from './pages/categories/Categories';
import Frames from './pages/frames/Frames';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerRegister from './pages/customer/CustomerRegister';
import PaymentCheckout from './pages/customer/PaymentCheckout';
import PaymentSuccess from './pages/customer/PaymentSuccess';
import PaymentFailed from './pages/customer/PaymentFailed';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/get-started" element={<CustomerRegister />} />
                <Route path="/payment/checkout" element={<PaymentCheckout />} />
                <Route path="/payment/success" element={<PaymentSuccess />} />
                <Route path="/payment/failed" element={<PaymentFailed />} />

                {/* Protected — Admin Layout */}
                <Route
                    element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/frame-layers" element={<FrameLayers />} />
                    <Route path="/packages" element={<ProtectedRoute permission="subscriptions.view"><Packages /></ProtectedRoute>} />
                    <Route path="/customers" element={<ProtectedRoute permission="customers.view"><Customers /></ProtectedRoute>} />
                    <Route path="/customers/:id" element={<ProtectedRoute permission="customers.view"><CustomerDetails /></ProtectedRoute>} />
                    <Route path="/users" element={<ProtectedRoute permission="users.view"><Users /></ProtectedRoute>} />
                    <Route path="/roles" element={<ProtectedRoute permission="roles.view"><Roles /></ProtectedRoute>} />
                    <Route path="/permissions" element={<ProtectedRoute permission="permissions.view"><Permissions /></ProtectedRoute>} />
                    <Route path="/categories" element={<ProtectedRoute permission="categories.view"><Categories /></ProtectedRoute>} />
                    <Route path="/frames" element={<ProtectedRoute permission="frames.view"><Frames /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute permission="settings.view"><Settings /></ProtectedRoute>} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
