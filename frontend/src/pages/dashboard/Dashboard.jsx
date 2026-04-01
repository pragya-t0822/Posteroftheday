import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from '../../api/axios';

export default function Dashboard() {
    const { user } = useSelector((state) => state.auth);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        axios.get('/dashboard/stats').then(res => setStats(res.data)).catch(() => {});
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const firstName = user?.name?.split(' ')[0] || 'there';

    const statCards = [
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
            ),
            color: 'bg-blue-500',
            value: stats?.total_users ?? '—',
            label: 'Total Users',
            desc: 'Registered accounts',
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
            ),
            color: 'bg-violet-500',
            value: stats?.total_roles ?? '—',
            label: 'Roles',
            desc: 'Access levels defined',
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
            ),
            color: 'bg-orange-500',
            value: stats?.total_permissions ?? '—',
            label: 'Permissions',
            desc: 'Granular controls',
        },
        {
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
            ),
            color: 'bg-teal-500',
            value: stats?.active_sessions ?? '—',
            label: 'Active Session',
            desc: 'Currently signed in',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Greeting */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Good {greeting}, {firstName} <span className="inline-block ml-1">👋</span>
                    </h2>
                    <p className="text-gray-500 mt-1">Welcome back to Poster of the Day admin panel.</p>
                </div>
                <span className="inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 text-white shrink-0">
                    {user?.role?.name || 'User'}
                </span>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow duration-300">
                        <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${card.color} mb-4`}>
                            {card.icon}
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        <p className="text-sm font-medium text-gray-700 mt-1">{card.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{card.desc}</p>
                    </div>
                ))}
            </div>

            {/* Signed in as */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Signed in as</p>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-sm font-bold">
                            {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <p className="text-base font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                </div>
            </div>

            {/* Info card */}
            <div className="bg-gray-900 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Dynamic Navigation</p>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                    Your sidebar is rendered from <code className="px-1.5 py-0.5 rounded bg-white/10 text-gray-200 text-xs font-mono">GET /api/navigation</code> and reflects only the sections your role has access to. Super Admins see everything — Staff and Customers only see Dashboard.
                </p>
            </div>
        </div>
    );
}
