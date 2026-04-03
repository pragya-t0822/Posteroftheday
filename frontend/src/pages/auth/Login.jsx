import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../../components/Logo';

const demoAccounts = [
    { role: 'Super Admin', email: 'superadmin@posteroftheday.com', color: 'bg-rose-500' },
    { role: 'Admin', email: 'admin@posteroftheday.com', color: 'bg-indigo-500' },
    { role: 'Staff', email: 'staff@posteroftheday.com', color: 'bg-emerald-500' },
    { role: 'Customer', email: 'customer@posteroftheday.com', color: 'bg-gray-500' },
];

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearError());
        const result = await dispatch(loginUser({ email, password }));
        if (loginUser.fulfilled.match(result)) {
            navigate('/dashboard');
        }
    };

    const fillDemo = (demoEmail) => {
        setEmail(demoEmail);
        setPassword('password');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="flex-1 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm space-y-6">

                {/* Logo + Heading */}
                <div className="flex flex-col items-center text-center">
                    <div className="mb-5">
                        <Logo size={72} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Poster of the Day</h1>
                    <p className="text-sm text-gray-400 mt-1.5">Sign in to continue</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Form Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                                placeholder="name@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 active:scale-[0.98] focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Signing in…
                                </span>
                            ) : 'Sign in'}
                        </button>
                    </form>
                </div>

                {/* Demo Accounts Card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                        Demo Accounts &middot; Password: <span className="font-mono text-gray-500">password</span>
                    </p>
                    <div className="space-y-1">
                        {demoAccounts.map((account) => (
                            <button
                                key={account.email}
                                type="button"
                                onClick={() => fillDemo(account.email)}
                                className="w-full flex items-center gap-3 text-left group hover:bg-gray-50 px-2.5 py-2 rounded-lg transition-colors"
                            >
                                <span className={`inline-flex items-center justify-center min-w-[88px] px-2.5 py-1 rounded-md text-[11px] font-bold text-white ${account.color}`}>
                                    {account.role}
                                </span>
                                <span className="text-sm text-gray-500 group-hover:text-gray-900 transition-colors truncate">
                                    {account.email}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer link */}
                <p className="text-center text-xs text-gray-400">
                    Customer?{' '}
                    <Link to="/customer/login" className="text-rose-500 hover:text-rose-600 font-medium transition-colors">
                        Go to Customer Login
                    </Link>
                </p>

            </div>
            </div>
            <footer className="py-4 text-center">
                <p className="text-[11px] text-gray-400">
                    Developed by{' '}
                    <a
                        href="https://www.innoverinfotech.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-rose-500 font-semibold transition-colors"
                    >
                        Innover Infotech Pvt. Ltd.
                    </a>
                </p>
            </footer>
        </div>
    );
}
