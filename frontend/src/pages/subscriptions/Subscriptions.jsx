import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPackages, createPackage, updatePackage, deletePackage, togglePackage } from '../../features/subscriptions/subscriptionSlice';

const durationLabels = { monthly: 'Monthly', quarterly: 'Quarterly', half_yearly: 'Half-Yearly', yearly: 'Yearly' };
const durationGradients = {
    monthly: 'from-blue-500 to-blue-600',
    quarterly: 'from-violet-500 to-violet-600',
    half_yearly: 'from-amber-500 to-amber-600',
    yearly: 'from-emerald-500 to-emerald-600',
};
const durationBadge = {
    monthly: 'bg-blue-50 text-blue-600 ring-blue-500/10',
    quarterly: 'bg-violet-50 text-violet-600 ring-violet-500/10',
    half_yearly: 'bg-amber-50 text-amber-600 ring-amber-500/10',
    yearly: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10',
};
const durationDays = { monthly: 30, quarterly: 90, half_yearly: 180, yearly: 365 };

/* ──────────── Modal ──────────── */
function PackageModal({ pkg, onClose, onSave }) {
    const [form, setForm] = useState({
        name: pkg?.name || '',
        slug: pkg?.slug || '',
        duration_type: pkg?.duration_type || 'monthly',
        duration_days: pkg?.duration_days || 30,
        price: pkg?.price || '',
        original_price: pkg?.original_price || '',
        discount_percent: pkg?.discount_percent || 0,
        description: pkg?.description || '',
        features: pkg?.features?.join(', ') || '',
        is_popular: pkg?.is_popular || false,
        is_active: pkg?.is_active ?? true,
        sort_order: pkg?.sort_order || 0,
    });

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleDurationChange = (type) => {
        setForm(f => ({ ...f, duration_type: type, duration_days: durationDays[type] || 30 }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = {
            ...form,
            features: form.features ? form.features.split(',').map(f => f.trim()).filter(Boolean) : [],
            price: parseFloat(form.price),
            original_price: form.original_price ? parseFloat(form.original_price) : null,
            discount_percent: parseInt(form.discount_percent) || 0,
            sort_order: parseInt(form.sort_order) || 0,
        };
        onSave(pkg ? { id: pkg.id, ...data } : data);
    };

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Modal header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{pkg ? 'Edit Package' : 'New Package'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{pkg ? 'Update the subscription details' : 'Create a new subscription plan'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    {/* Row 1: Name + Slug */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Package Name</label>
                            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Quarterly Pro" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Slug</label>
                            <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} placeholder="quarterly-pro" required />
                        </div>
                    </div>

                    {/* Row 2: Duration */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Duration Type</label>
                            <select value={form.duration_type} onChange={e => handleDurationChange(e.target.value)} className={inputCls}>
                                <option value="monthly">Monthly (30 days)</option>
                                <option value="quarterly">Quarterly (90 days)</option>
                                <option value="half_yearly">Half-Yearly (180 days)</option>
                                <option value="yearly">Yearly (365 days)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Duration (days)</label>
                            <input type="number" value={form.duration_days} onChange={e => set('duration_days', e.target.value)} className={inputCls} required min={1} />
                        </div>
                    </div>

                    {/* Row 3: Pricing */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Price (₹)</label>
                            <input type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} className={inputCls} required min={0} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Original (₹)</label>
                            <input type="number" step="0.01" value={form.original_price} onChange={e => set('original_price', e.target.value)} className={inputCls} min={0} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Discount %</label>
                            <input type="number" value={form.discount_percent} onChange={e => set('discount_percent', e.target.value)} className={inputCls} min={0} max={100} />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} rows={2} placeholder="Brief plan description..." />
                    </div>

                    {/* Features */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Features <span className="text-gray-400">(comma-separated)</span></label>
                        <textarea value={form.features} onChange={e => set('features', e.target.value)} className={inputCls} rows={2} placeholder="HD downloads, Premium templates, Priority support" />
                    </div>

                    {/* Toggles row */}
                    <div className="flex items-center gap-5 py-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.is_popular} onChange={e => set('is_popular', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500" />
                            <span className="text-sm text-gray-700">Popular</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500" />
                            <span className="text-sm text-gray-700">Active</span>
                        </label>
                        <div className="flex items-center gap-2 ml-auto">
                            <label className="text-xs text-gray-500">Sort order</label>
                            <input type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-center outline-none focus:border-rose-500" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all">
                            {pkg ? 'Update Package' : 'Create Package'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────── Delete Confirm ──────────── */
function DeleteModal({ pkg, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center">Delete Package</h3>
                <p className="text-sm text-gray-500 text-center mt-2">
                    Are you sure you want to delete <span className="font-semibold text-gray-700">{pkg.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => { onConfirm(pkg.id); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function Subscriptions() {
    const dispatch = useDispatch();
    const { items: packages, loading } = useSelector((state) => state.subscriptions);
    const [modal, setModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => { dispatch(fetchPackages()); }, [dispatch]);

    const handleSave = async (data) => {
        if (data.id) {
            await dispatch(updatePackage(data));
        } else {
            await dispatch(createPackage(data));
        }
        setModal(null);
        dispatch(fetchPackages());
    };

    const handleDelete = async (id) => {
        await dispatch(deletePackage(id));
    };

    const handleToggle = async (id) => {
        await dispatch(togglePackage(id));
    };

    const activeCount = packages.filter(p => p.is_active).length;
    const totalRevenuePotential = packages.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Subscription Packages</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage pricing plans for your customers</p>
                </div>
                <button
                    onClick={() => setModal('new')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98]"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Package
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{packages.length}</p>
                            <p className="text-xs text-gray-400">Total Plans</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
                            <p className="text-xs text-gray-400">Active Plans</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">₹{parseInt(totalRevenuePotential)}</p>
                            <p className="text-xs text-gray-400">Combined Value</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Package Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            ) : packages.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">No packages yet</h3>
                    <p className="text-sm text-gray-400 mt-1 mb-5">Create your first subscription package to get started.</p>
                    <button onClick={() => setModal('new')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Package
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    {packages.map((pkg) => {
                        const free = parseFloat(pkg.price) === 0;
                        const popular = pkg.is_popular;
                        return (
                            <div
                                key={pkg.id}
                                className={`relative bg-white rounded-2xl border flex flex-col transition-all duration-300 hover:shadow-lg ${
                                    popular
                                        ? 'border-rose-200 ring-2 ring-rose-500/20 shadow-md'
                                        : 'border-gray-100 shadow-sm'
                                } ${!pkg.is_active ? 'opacity-50' : ''}`}
                            >
                                {/* Popular ribbon */}
                                {popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/30 uppercase tracking-wider">
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                {/* Card top — colored bar */}
                                <div className={`h-1.5 rounded-t-2xl bg-gradient-to-r ${durationGradients[pkg.duration_type] || 'from-gray-400 to-gray-500'}`} />

                                <div className="p-5 flex flex-col flex-1">
                                    {/* Duration badge + Toggle */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${durationBadge[pkg.duration_type] || 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
                                            {durationLabels[pkg.duration_type] || pkg.duration_type}
                                        </span>
                                        <button
                                            onClick={() => handleToggle(pkg.id)}
                                            className={`relative w-10 h-[22px] rounded-full transition-colors duration-200 ${pkg.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${pkg.is_active ? 'left-[22px]' : 'left-[3px]'}`} />
                                        </button>
                                    </div>

                                    {/* Name */}
                                    <h3 className="text-base font-bold text-gray-900 leading-tight">{pkg.name}</h3>

                                    {/* Price */}
                                    <div className="mt-2.5 mb-0.5">
                                        <span className="text-3xl font-extrabold text-gray-900 leading-none">
                                            {free ? 'Free' : `₹${parseInt(pkg.price)}`}
                                        </span>
                                        {!free && (
                                            <span className="text-xs text-gray-400 ml-1">
                                                /{(durationLabels[pkg.duration_type] || '').toLowerCase()}
                                            </span>
                                        )}
                                    </div>

                                    {/* Original price + Discount */}
                                    {pkg.original_price && parseFloat(pkg.original_price) > parseFloat(pkg.price) ? (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="text-xs text-gray-400 line-through">₹{parseInt(pkg.original_price)}</span>
                                            {pkg.discount_percent > 0 && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600">
                                                    {pkg.discount_percent}% off
                                                </span>
                                            )}
                                        </div>
                                    ) : null}

                                    <p className="text-[11px] text-gray-400 mt-1 mb-3">{pkg.duration_days} days access</p>

                                    {/* Description */}
                                    {pkg.description && (
                                        <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{pkg.description}</p>
                                    )}

                                    {/* Divider */}
                                    <div className="h-px bg-gray-100 mb-3" />

                                    {/* Features */}
                                    {pkg.features && pkg.features.length > 0 && (
                                        <ul className="space-y-1.5 mb-auto">
                                            {pkg.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                                    <svg className="w-3.5 h-3.5 text-emerald-500 mt-px shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={() => setModal(pkg)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                                            </svg>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(pkg)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-100 text-xs font-semibold text-red-500 hover:bg-red-50 hover:border-red-200 transition-all"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {modal && (
                <PackageModal
                    pkg={modal === 'new' ? null : modal}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}
            {deleteTarget && (
                <DeleteModal
                    pkg={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}
