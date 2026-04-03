import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../features/auth/authSlice';
import Logo from './Logo';

const DashboardIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
);

const UserIcon = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
);

const LogOutIcon = ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);

const MenuIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const XIcon = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export default function CustomerLayout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/customer/login');
    };

    const navItems = [
        { path: '/customer/dashboard', label: 'Dashboard', icon: DashboardIcon },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50">
            {/* Top Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/customer/dashboard" className="flex items-center gap-2.5">
                            <Logo size={36} />
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-gray-900 leading-tight">Poster of the Day</span>
                                <span className="text-[10px] text-rose-500 font-medium uppercase tracking-widest">Customer</span>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                            isActive
                                                ? 'bg-rose-50 text-rose-600'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <Icon className="w-[18px] h-[18px]" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User + Logout */}
                        <div className="hidden md:flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50">
                                <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
                                    <UserIcon className="w-3.5 h-3.5 text-rose-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{user?.name || 'Customer'}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                            >
                                <LogOutIcon className="w-4 h-4" />
                                Logout
                            </button>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                        >
                            {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                                        isActive ? 'bg-rose-50 text-rose-600' : 'text-gray-600'
                                    }`}
                                >
                                    <Icon className="w-[18px] h-[18px]" />
                                    {item.label}
                                </Link>
                            );
                        })}
                        <div className="border-t border-gray-100 pt-2 mt-2">
                            <div className="flex items-center gap-2 px-3 py-2">
                                <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
                                    <UserIcon className="w-3.5 h-3.5 text-rose-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                                <LogOutIcon className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 bg-white/60 py-4 text-center">
                <p className="text-[11px] text-gray-400">
                    Developed by{' '}
                    <a href="https://www.innoverinfotech.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-rose-500 font-semibold transition-colors">
                        Innover Infotech Pvt. Ltd.
                    </a>
                </p>
            </footer>
        </div>
    );
}
