import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { logoutUser } from '../features/auth/authSlice';
import { clearNavigation } from '../features/navigation/navigationSlice';
import Logo from './Logo';

const iconMap = {
    LayoutDashboard: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
    ),
    Image: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
    ),
    Users: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    ),
    Shield: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    ),
    ShieldCheck: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    ),
    Key: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
    ),
    UserGroup: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
    ),
    CreditCard: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
    ),
    Upload: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
    ),
    Folder: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
        </svg>
    ),
    Settings: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
};

const defaultIcon = (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

function NavItem({ item, collapsed }) {
    const [open, setOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;
    const icon = iconMap[item.icon] || defaultIcon;

    if (hasChildren) {
        return (
            <div>
                <button
                    onClick={() => setOpen(!open)}
                    className={`w-full flex items-center gap-3 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200 ${collapsed ? 'justify-center px-0' : 'px-4'}`}
                    title={collapsed ? item.title : undefined}
                >
                    {icon}
                    {!collapsed && <span className="flex-1 text-left">{item.title}</span>}
                    {!collapsed && (
                        <svg className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    )}
                </button>
                {open && !collapsed && (
                    <div className="mt-1 space-y-0.5 pl-4">
                        {item.children.map((child) => (
                            <NavItem key={child.id} item={child} collapsed={collapsed} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <NavLink
            to={item.route}
            title={collapsed ? item.title : undefined}
            className={({ isActive }) =>
                `flex items-center gap-3 py-2.5 text-sm rounded-xl transition-all duration-200 ${collapsed ? 'justify-center px-0' : 'px-4'} ${
                    isActive
                        ? 'bg-rose-500 text-white font-medium shadow-lg shadow-rose-500/25'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
            }
        >
            {icon}
            {!collapsed && <span>{item.title}</span>}
        </NavLink>
    );
}

export default function Sidebar({ collapsed, onToggle }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items } = useSelector((state) => state.navigation);
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        dispatch(clearNavigation());
        await dispatch(logoutUser());
        navigate('/login');
    };

    const dashboardItem = items.find(i => i.route === '/dashboard');
    const managementItems = items.filter(i => i.route !== '/dashboard');

    return (
        <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-gray-950 transition-all duration-300 overflow-hidden ${collapsed ? 'w-[68px]' : 'w-60'}`}>
            {/* Logo */}
            <div className={`flex items-center h-16 border-b border-white/5 shrink-0 ${collapsed ? 'justify-center px-0' : 'gap-3 px-4'}`}>
                <button onClick={onToggle} className="shrink-0 hover:opacity-80 transition-opacity" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                    <Logo size={34} />
                </button>
                {!collapsed && (
                    <div className="min-w-0">
                        <span className="text-white font-bold text-sm tracking-tight block truncate">Poster of Day</span>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">Admin</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className={`flex-1 overflow-y-auto py-4 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
                {dashboardItem && <NavItem item={dashboardItem} collapsed={collapsed} />}
                {managementItems.length > 0 && (
                    <>
                        {!collapsed ? (
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-4 pt-6 pb-2">Management</p>
                        ) : (
                            <div className="h-px bg-white/5 my-4 mx-1" />
                        )}
                        {managementItems.map((item) => (
                            <NavItem key={item.id} item={item} collapsed={collapsed} />
                        ))}
                    </>
                )}
            </nav>

            {/* User section */}
            <div className={`border-t border-white/5 py-4 shrink-0 ${collapsed ? 'px-2' : 'px-4'}`}>
                {collapsed ? (
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                                {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <button onClick={handleLogout} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors" title="Sign out">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">
                                {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-400">
                                {user?.role?.name || 'User'}
                            </span>
                        </div>
                        <button onClick={handleLogout} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors" title="Sign out">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
