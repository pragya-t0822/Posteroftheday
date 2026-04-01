import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../features/auth/authSlice';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading, error } = useSelector((state) => state.auth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearError());
        const result = await dispatch(registerUser({ name, email, password, password_confirmation: passwordConfirmation }));
        if (registerUser.fulfilled.match(result)) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/25">
                        <span className="text-white font-bold text-xl">P</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Create account</h1>
                    <p className="text-sm text-gray-500 mt-1">Get started with your admin panel</p>
                </div>

                {error && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">{error}</div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            placeholder="Your name" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            placeholder="you@example.com" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            placeholder="Min 8 characters" required minLength={8} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                        <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                            placeholder="Confirm password" required minLength={8} />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Creating account...' : 'Create account'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
