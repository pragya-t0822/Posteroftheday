import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublicPackages, registerCustomer, setSelectedPackage, clearCustomerError } from '../../features/customer/customerSlice';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../../components/Logo';
import Footer from '../../components/Footer';

const durationLabels = { monthly: 'Monthly', quarterly: 'Quarterly', half_yearly: 'Half-Yearly', yearly: 'Yearly' };
const durationColors = {
    monthly: 'from-blue-500 to-blue-600',
    quarterly: 'from-violet-500 to-violet-600',
    half_yearly: 'from-amber-500 to-amber-600',
    yearly: 'from-emerald-500 to-emerald-600',
};
const steps = [
    { num: 1, label: 'Choose Plan', icon: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z' },
    { num: 2, label: 'Your Details', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
    { num: 3, label: 'Payment', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
];

export default function CustomerRegister() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { packages, selectedPackage, loading, error } = useSelector((state) => state.customer);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', password_confirmation: '' });

    useEffect(() => { dispatch(fetchPublicPackages()); }, [dispatch]);

    const handleSelectPlan = (pkg) => {
        dispatch(setSelectedPackage(pkg));
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        dispatch(clearCustomerError());
        const result = await dispatch(registerCustomer({ ...form, package_id: selectedPackage.id }));
        if (registerCustomer.fulfilled.match(result)) {
            if (result.payload.requires_payment) {
                navigate('/payment/checkout', { state: { subscription: result.payload.subscription } });
            } else {
                navigate('/payment/success', { state: { free: true } });
            }
        }
    };

    const isFree = (pkg) => parseFloat(pkg?.price) === 0;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">

            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <Logo size={34} />
                        <span className="text-base font-bold text-gray-900">Poster of the Day</span>
                    </Link>
                    <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors flex items-center gap-1.5">
                        <span>Already have an account?</span>
                        <span className="text-rose-500 hover:text-rose-600">Sign in</span>
                    </Link>
                </div>
            </nav>

            <div className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        {step === 1 ? 'Choose your plan' : 'Create your account'}
                    </h1>
                    <p className="text-gray-400 mt-3 text-base max-w-lg mx-auto">
                        {step === 1
                            ? 'Start with a 14-day free trial. Upgrade anytime. Cancel hassle-free.'
                            : 'Just a few details and you\'re in.'}
                    </p>

                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-1 mt-10">
                        {steps.map((s, i) => (
                            <div key={s.num} className="flex items-center">
                                <button
                                    onClick={() => { if (s.num < step) setStep(s.num); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                                        step === s.num
                                            ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                                            : step > s.num
                                                ? 'bg-rose-50 text-rose-600 cursor-pointer hover:bg-rose-100'
                                                : 'bg-gray-100 text-gray-400 cursor-default'
                                    }`}
                                >
                                    {step > s.num ? (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                                        </svg>
                                    )}
                                    {s.label}
                                </button>
                                {i < steps.length - 1 && (
                                    <div className={`w-12 h-px mx-2 transition-colors duration-300 ${step > s.num ? 'bg-rose-300' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="max-w-lg mx-auto mb-8 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600 text-center flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* ===== STEP 1: Plan Cards ===== */}
                {step === 1 && (
                    <div>
                        {/* Cards row */}
                        <div className="grid grid-cols-5 gap-4">
                            {packages.map((pkg) => {
                                const free = isFree(pkg);
                                const popular = pkg.is_popular;
                                return (
                                    <div
                                        key={pkg.id}
                                        onClick={() => handleSelectPlan(pkg)}
                                        className={`relative bg-white rounded-2xl border p-5 cursor-pointer group transition-all duration-300 flex flex-col ${
                                            popular
                                                ? 'border-rose-200 ring-2 ring-rose-500/20 shadow-lg shadow-rose-500/5 scale-[1.02]'
                                                : 'border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 hover:-translate-y-1'
                                        }`}
                                    >
                                        {/* Popular ribbon */}
                                        {popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 uppercase tracking-wider whitespace-nowrap">
                                                    Most Popular
                                                </span>
                                            </div>
                                        )}

                                        {/* Duration pill */}
                                        <span className={`self-start inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wide bg-gradient-to-r ${durationColors[pkg.duration_type] || 'from-gray-500 to-gray-600'}`}>
                                            {durationLabels[pkg.duration_type] || pkg.duration_type}
                                        </span>

                                        {/* Name */}
                                        <h3 className="text-sm font-bold text-gray-900 mt-3 leading-tight">{pkg.name}</h3>

                                        {/* Price block */}
                                        <div className="mt-3 mb-1">
                                            <span className="text-2xl font-extrabold text-gray-900 leading-none">
                                                {free ? 'Free' : `₹${parseInt(pkg.price)}`}
                                            </span>
                                            {!free && (
                                                <span className="text-[11px] text-gray-400 ml-0.5">
                                                    /{(durationLabels[pkg.duration_type] || '').toLowerCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Original price + discount */}
                                        {pkg.original_price && parseFloat(pkg.original_price) > parseFloat(pkg.price) ? (
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="text-[11px] text-gray-400 line-through">₹{parseInt(pkg.original_price)}</span>
                                                {pkg.discount_percent > 0 && (
                                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-600 leading-none">
                                                        {pkg.discount_percent}% off
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-4" />
                                        )}

                                        <p className="text-[11px] text-gray-400 mb-3">{pkg.duration_days} days access</p>

                                        {/* Divider */}
                                        <div className="h-px bg-gray-100 mb-3" />

                                        {/* Features */}
                                        {pkg.features && pkg.features.length > 0 && (
                                            <ul className="space-y-1.5 mb-auto">
                                                {pkg.features.slice(0, 4).map((f, i) => (
                                                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-500 leading-tight">
                                                        <svg className="w-3 h-3 text-emerald-500 mt-px shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                        <span>{f}</span>
                                                    </li>
                                                ))}
                                                {pkg.features.length > 4 && (
                                                    <li className="text-[10px] text-gray-400 pl-4">+{pkg.features.length - 4} more</li>
                                                )}
                                            </ul>
                                        )}

                                        {/* CTA */}
                                        <button className={`w-full mt-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                            popular
                                                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-sm shadow-rose-500/20 group-hover:shadow-md group-hover:shadow-rose-500/30'
                                                : 'bg-gray-900 text-white group-hover:bg-gradient-to-r group-hover:from-rose-500 group-hover:to-pink-500'
                                        }`}>
                                            {free ? 'Start Free Trial' : 'Get Started'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Trust bar */}
                        <div className="flex items-center justify-center gap-6 mt-10 text-[11px] text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                </svg>
                                Secure payment via Razorpay
                            </span>
                            <span className="w-px h-3 bg-gray-200" />
                            <span className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18.75h6" />
                                </svg>
                                Premium mobile app access
                            </span>
                            <span className="w-px h-3 bg-gray-200" />
                            <span className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Prices in INR
                            </span>
                        </div>
                    </div>
                )}

                {/* ===== STEP 2: Registration Form ===== */}
                {step === 2 && (
                    <div className="max-w-md mx-auto">

                        {/* Selected plan summary */}
                        {selectedPackage && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${durationColors[selectedPackage.duration_type] || 'from-gray-500 to-gray-600'} flex items-center justify-center text-white shrink-0`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900">{selectedPackage.name}</p>
                                        <p className="text-xs text-gray-400">{selectedPackage.duration_days} days access</p>
                                    </div>
                                    <div className="text-right mr-2">
                                        <p className="text-lg font-bold text-gray-900">
                                            {isFree(selectedPackage) ? 'Free' : `₹${parseInt(selectedPackage.price)}`}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="text-xs text-rose-500 font-semibold hover:text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                                    >
                                        Change
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Form card */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Phone <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                                        <input
                                            type="password"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                                            placeholder="Min 8 chars"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm</label>
                                        <input
                                            type="password"
                                            value={form.password_confirmation}
                                            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                                            placeholder="Confirm"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gradient-to-r hover:from-rose-500 hover:to-pink-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                                >
                                    {loading ? (
                                        <span className="inline-flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Creating account…
                                        </span>
                                    ) : isFree(selectedPackage) ? 'Create Free Account' : 'Continue to Payment'}
                                </button>
                            </form>
                        </div>

                        <p className="text-center text-xs text-gray-400 mt-5">
                            By signing up you agree to our Terms of Service.
                        </p>
                    </div>
                )}
            </div>

            <Footer className="border-t border-gray-100 bg-white" />
        </div>
    );
}
