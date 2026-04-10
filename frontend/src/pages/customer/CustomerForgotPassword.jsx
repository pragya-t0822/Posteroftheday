import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Logo from '../../components/Logo';

export default function CustomerForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=email, 2=otp, 3=new password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axios.post('/customer/forgot-password/send-otp', { email });
            setMessage(res.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post('/customer/forgot-password/verify-otp', { email, otp });
            setMessage('');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== passwordConfirmation) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            await axios.post('/customer/forgot-password/reset', {
                email,
                otp,
                password,
                password_confirmation: passwordConfirmation,
            });
            navigate('/customer/login', { state: { passwordReset: true } });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setMessage('');
        setLoading(true);
        try {
            const res = await axios.post('/customer/forgot-password/send-otp', { email });
            setMessage('A new OTP has been sent to your email.');
            setOtp('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    // Step indicators
    const stepLabels = ['Email', 'Verify OTP', 'New Password'];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-rose-50 via-white to-orange-50">
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-sm space-y-6">

                    {/* Logo + Heading */}
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-5">
                            <Logo size={72} />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Reset Password</h1>
                        <p className="text-sm text-gray-400 mt-1.5">
                            {step === 1 && 'Enter your email to receive an OTP'}
                            {step === 2 && 'Enter the OTP sent to your email'}
                            {step === 3 && 'Set your new password'}
                        </p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-1">
                        {stepLabels.map((label, i) => (
                            <div key={label} className="flex items-center">
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                    step === i + 1
                                        ? 'bg-rose-500 text-white shadow-sm'
                                        : step > i + 1
                                            ? 'bg-rose-100 text-rose-600'
                                            : 'bg-gray-100 text-gray-400'
                                }`}>
                                    {step > i + 1 ? (
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    ) : (
                                        <span>{i + 1}</span>
                                    )}
                                    <span className="hidden sm:inline">{label}</span>
                                </div>
                                {i < stepLabels.length - 1 && (
                                    <div className={`w-8 h-px mx-1 ${step > i + 1 ? 'bg-rose-300' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Success message */}
                    {message && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-600">
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {message}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* ===== STEP 1: Email ===== */}
                    {step === 1 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                                        placeholder="name@example.com"
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
                                            Sending OTP...
                                        </span>
                                    ) : 'Send OTP'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* ===== STEP 2: OTP Verification ===== */}
                    {step === 2 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                </div>
                                <p className="text-xs text-gray-400">OTP sent to <span className="font-medium text-gray-600">{email}</span></p>
                            </div>
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Enter OTP</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-center text-lg font-mono font-bold tracking-[0.3em] text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                                        placeholder="000000"
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 text-white text-sm font-semibold hover:from-rose-600 hover:to-orange-500 active:scale-[0.98] focus:ring-2 focus:ring-rose-400/20 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Verifying...
                                        </span>
                                    ) : 'Verify OTP'}
                                </button>
                            </form>
                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={loading}
                                    className="text-xs text-rose-500 hover:text-rose-600 font-medium transition-colors disabled:opacity-50"
                                >
                                    Didn't receive it? Resend OTP
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 3: New Password ===== */}
                    {step === 3 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <div className="text-center mb-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                                    <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </div>
                                <p className="text-xs text-gray-400">OTP verified. Set your new password.</p>
                            </div>
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                                        placeholder="Min 8 characters"
                                        minLength={8}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                                        placeholder="Confirm new password"
                                        minLength={8}
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
                                            Resetting...
                                        </span>
                                    ) : 'Reset Password'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Back to login */}
                    <p className="text-center text-xs text-gray-400">
                        Remember your password?{' '}
                        <Link to="/customer/login" className="text-rose-500 hover:text-rose-600 font-medium transition-colors">
                            Back to Login
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
