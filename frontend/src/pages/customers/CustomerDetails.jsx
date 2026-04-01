import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomerDetail, updateCustomer, deleteCustomer, clearCustomerDetail } from '../../features/customers/customerManagementSlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';

const avatarColors = ['from-rose-500 to-pink-600', 'from-blue-500 to-indigo-600', 'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600', 'from-emerald-500 to-teal-600', 'from-cyan-500 to-blue-600'];
const getAvatarColor = (id) => avatarColors[(id || 0) % avatarColors.length];
const getInitials = (name) => { if (!name) return '?'; const p = name.trim().split(/\s+/); return p.length >= 2 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase(); };
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
const formatDateTime = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

/* ──────── Info Row ──────── */
function InfoRow({ icon, label, value, badge }) {
    return (
        <div className="flex items-start gap-3 py-3">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 text-gray-400">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">{label}</p>
                {badge || <p className="text-sm text-gray-900 mt-0.5 break-all">{value || '—'}</p>}
            </div>
        </div>
    );
}

/* ──────── Delete Confirmation ──────── */
function DeleteModal({ name, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center">Delete Customer</h3>
                <p className="text-sm text-gray-500 text-center mt-2">Are you sure you want to delete <span className="font-semibold text-gray-700">{name}</span>? All their data including subscriptions will be permanently removed.</p>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">Delete</button>
                </div>
            </div>
        </div>
    );
}

/* ──────── Edit Modal ──────── */
function EditModal({ customer, onClose, onSave }) {
    const [form, setForm] = useState({
        name: customer.name || '', email: customer.email || '',
        phone: customer.phone || '', status: customer.status || 'active',
    });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave({ id: customer.id, ...form });
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Edit Customer</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                        <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} required />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                        <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="+91 98765 43210" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                        <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════
   Main Page
   ══════════════════════════════════════ */
export default function CustomerDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { detail: customer, detailLoading: loading, error } = useSelector(s => s.customerManagement);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        dispatch(fetchCustomerDetail(id));
        return () => dispatch(clearCustomerDetail());
    }, [dispatch, id]);

    const handleToggleStatus = async () => {
        const newStatus = customer.status === 'active' ? 'inactive' : 'active';
        const result = await dispatch(updateCustomer({ id: customer.id, status: newStatus }));
        if (result.error) return alertError('Update Failed', result.payload);
        dispatch(fetchCustomerDetail(id));
        alertSuccess(`Customer ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`);
    };

    const handleEdit = async (data) => {
        const result = await dispatch(updateCustomer(data));
        if (result.error) return alertError('Update Failed', result.payload);
        setShowEdit(false);
        dispatch(fetchCustomerDetail(id));
        alertSuccess('Customer Updated');
    };

    const handleDelete = async () => {
        const confirmed = await alertConfirmDelete(customer.name);
        if (!confirmed) return;
        const result = await dispatch(deleteCustomer(customer.id));
        if (result.error) return alertError('Delete Failed', result.payload);
        alertSuccess('Customer Deleted');
        navigate('/customers');
    };

    // Derived data
    const activeSubscription = customer?.subscriptions?.find(s => s.status === 'active' && s.ends_at && new Date(s.ends_at) > new Date());
    const allSubscriptions = customer?.subscriptions || [];

    if (loading || !customer) {
        return (
            <div className="flex items-center justify-center py-32">
                <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <p className="text-sm text-red-500">{error}</p>
                <button onClick={() => navigate('/customers')} className="mt-4 text-sm text-rose-500 font-semibold hover:underline">Back to Customers</button>
            </div>
        );
    }

    const daysRemaining = activeSubscription?.ends_at ? Math.max(0, Math.ceil((new Date(activeSubscription.ends_at) - new Date()) / 86400000)) : 0;

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/customers')}
                        className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Details</h2>
                        <p className="text-sm text-gray-400 mt-0.5">View and manage customer information</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleToggleStatus}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${customer.status === 'active' ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>
                        {customer.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => setShowEdit(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                        Edit
                    </button>
                    <button onClick={() => setShowDelete(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        Delete
                    </button>
                </div>
            </div>

            {/* ── Profile Card + Subscription ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile */}
                <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="text-center mb-6">
                        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getAvatarColor(customer.id)} flex items-center justify-center mx-auto shadow-lg`}>
                            <span className="text-white text-2xl font-bold">{getInitials(customer.name)}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mt-4">{customer.name}</h3>
                        <p className="text-sm text-gray-400">{customer.email}</p>
                        <div className="mt-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${customer.status === 'active' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${customer.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                {customer.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        <InfoRow label="Phone Number" value={customer.phone}
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>} />
                        <InfoRow label="Registration Date" value={formatDate(customer.created_at)}
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>} />
                        <InfoRow label="Role" value={customer.role?.name || '—'}
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>} />
                    </div>
                </div>

                {/* Subscription & Package */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Active Package Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                            Current Package
                        </h3>
                        {activeSubscription ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100">
                                    <p className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Package</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">{activeSubscription.package?.name || '—'}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{activeSubscription.package?.duration_type}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Status</p>
                                    <span className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold ${activeSubscription.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${activeSubscription.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                        {activeSubscription.status.charAt(0).toUpperCase() + activeSubscription.status.slice(1)}
                                    </span>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Expires On</p>
                                    <p className="text-sm font-bold text-gray-900 mt-1">{formatDate(activeSubscription.ends_at)}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{daysRemaining} days remaining</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Price</p>
                                    <p className="text-lg font-bold text-gray-900 mt-1">&#8377;{activeSubscription.package?.price || '—'}</p>
                                    {activeSubscription.package?.original_price && (
                                        <p className="text-xs text-gray-400 line-through mt-0.5">&#8377;{activeSubscription.package.original_price}</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                                <p className="text-sm text-gray-400">No active subscription</p>
                            </div>
                        )}
                    </div>

                    {/* Social Media Links (from frame layer parameters if any) */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                            Social Media & Contact
                        </h3>
                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-xs text-gray-400">Social media links will appear here once the customer generates posters with their contact details.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Subscription History ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Subscription History
                    </h3>
                </div>
                {allSubscriptions.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-sm text-gray-400">No subscription history</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Package</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Start Date</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Expiry Date</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Amount</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Payment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {allSubscriptions.map(sub => {
                                    const statusColors = { active: 'bg-emerald-50 text-emerald-600', pending: 'bg-amber-50 text-amber-600', expired: 'bg-gray-100 text-gray-500', cancelled: 'bg-red-50 text-red-500' };
                                    const payment = sub.payments?.[0];
                                    const paymentColors = { paid: 'text-emerald-600', pending: 'text-amber-600', failed: 'text-red-500' };
                                    return (
                                        <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <p className="text-sm font-medium text-gray-900">{sub.package?.name || '—'}</p>
                                                <p className="text-[11px] text-gray-400">{sub.package?.duration_type}</p>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColors[sub.status] || 'bg-gray-100 text-gray-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'active' ? 'bg-emerald-500' : sub.status === 'pending' ? 'bg-amber-500' : sub.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
                                                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-sm text-gray-600">{formatDate(sub.starts_at)}</td>
                                            <td className="px-6 py-3.5 text-sm text-gray-600">{formatDate(sub.ends_at)}</td>
                                            <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">&#8377;{sub.package?.price || '—'}</td>
                                            <td className="px-6 py-3.5">
                                                {payment ? (
                                                    <span className={`text-xs font-semibold ${paymentColors[payment.status] || 'text-gray-400'}`}>
                                                        {payment.status === 'paid' ? 'Paid' : payment.status === 'pending' ? 'Pending' : 'Failed'}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Activity Timeline ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
                    Activity History
                </h3>
                <div className="space-y-4">
                    {/* Registration */}
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" /></svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Account Created</p>
                            <p className="text-xs text-gray-400">{formatDateTime(customer.created_at)}</p>
                        </div>
                    </div>

                    {/* Subscription events */}
                    {allSubscriptions.map(sub => (
                        <div key={sub.id} className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${sub.status === 'active' ? 'bg-blue-50' : sub.status === 'expired' ? 'bg-gray-100' : 'bg-amber-50'}`}>
                                <svg className={`w-4 h-4 ${sub.status === 'active' ? 'text-blue-500' : sub.status === 'expired' ? 'text-gray-400' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    Subscribed to <span className="text-rose-500">{sub.package?.name}</span>
                                    {sub.status === 'expired' && <span className="text-gray-400 font-normal"> (expired)</span>}
                                    {sub.status === 'cancelled' && <span className="text-red-400 font-normal"> (cancelled)</span>}
                                </p>
                                <p className="text-xs text-gray-400">{formatDateTime(sub.created_at)}</p>
                            </div>
                        </div>
                    ))}

                    {allSubscriptions.length === 0 && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                                <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-sm text-gray-400 mt-1.5">No further activity</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modals ── */}
            {showEdit && <EditModal customer={customer} onClose={() => setShowEdit(false)} onSave={handleEdit} />}
            {showDelete && <DeleteModal name={customer.name} onClose={() => setShowDelete(false)} onConfirm={handleDelete} />}
        </div>
    );
}
