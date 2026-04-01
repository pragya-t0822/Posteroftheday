import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { fetchNavigation } from '../features/navigation/navigationSlice';
import { fetchUser } from '../features/auth/authSlice';

const pageTitles = {
    '/dashboard': 'Dashboard',
    '/customers': 'Customers',
    '/users': 'User Management',
    '/roles': 'Roles & Access',
    '/permissions': 'Permissions',
    '/posters': 'Posters',
    '/subscriptions': 'Subscription Packages',
    '/settings': 'Settings',
};

export default function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const dispatch = useDispatch();
    const location = useLocation();

    useEffect(() => {
        dispatch(fetchNavigation());
        dispatch(fetchUser());
    }, [dispatch]);

    const title = pageTitles[location.pathname] || 'Dashboard';

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            <div className={`flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-60'}`}>
                <Header collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} title={title} />
                <main className="flex-1 p-6 pb-16">
                    <Outlet />
                </main>
                <Footer className={`fixed bottom-0 right-0 z-20 h-10 flex items-center justify-center border-t border-gray-100 bg-white transition-all duration-300 ${collapsed ? 'left-[68px]' : 'left-60'}`} />
            </div>
        </div>
    );
}
