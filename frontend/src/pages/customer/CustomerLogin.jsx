import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { customerLogin, clearError } from '../../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../../components/Logo';

export default function CustomerLogin() {
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearError());
        const result = await dispatch(customerLogin({ login, password }));
        if (customerLogin.fulfilled.match(result)) {
            navigate('/customer/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50 via-white to-orange-50">
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm space-y-6">

                    {/* Logo + Heading */}
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-5">
                            <Logo size={72} />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
                        <p className="text-sm text-gray-400 mt-1.5">Sign in to your customer account</p>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email or Mobile</label>
                                <input
                                    type="text"
                                    value={login}
                                    onChange={(e) => setLogin(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                                    placeholder="name@example.com or 9876543210"
                                    required
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <button type="button" onClick={() => alert('Forgot password feature coming soon!')} className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors">
                                        Forgot Password?
                                    </button>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                                    placeholder="********"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white text-sm font-semibold hover:from-rose-600 hover:to-orange-500 active:scale-[0.98] focus:ring-2 focus:ring-rose-400/20 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <span className="inline-flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : 'Sign In'}
                            </button>
                        </form>
                    </div>

                    {/* Register link */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
                        <p className="text-sm text-gray-500">
                            Don't have an account?{' '}
                            <Link to="/get-started" className="text-rose-500 hover:text-rose-600 font-semibold transition-colors">
                                Register Now
                            </Link>
                        </p>
                    </div>

                    {/* Admin link */}
                    <p className="text-center text-xs text-gray-400">
                        Admin?{' '}
                        <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                            Go to Admin Login
                        </Link>
                    </p>

                </div>
            </div>
            <footer className="py-4 text-center">
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
