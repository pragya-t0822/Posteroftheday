import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomerDetail, updateCustomer, deleteCustomer, clearCustomerDetail, fetchCustomerReferrals, updateReferralStatus, clearCustomerReferrals, fetchCustomerFrameRequests, clearCustomerFrameRequests } from '../../features/customers/customerManagementSlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';

const STORAGE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') + '/storage/';
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
    const { detail: customer, detailLoading: loading, error, referrals, referralsLoading, referralsPagination, frameRequests, frameRequestsLoading, frameRequestsPagination } = useSelector(s => s.customerManagement);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [refSearch, setRefSearch] = useState('');
    const [refStatusFilter, setRefStatusFilter] = useState('');
    const [refSearchTimeout, setRefSearchTimeout] = useState(null);
    const [shareTarget, setShareTarget] = useState(null);
    const [copied, setCopied] = useState(false);
    const [frSearch, setFrSearch] = useState('');
    const [frStatusFilter, setFrStatusFilter] = useState('');
    const [frSearchTimeout, setFrSearchTimeout] = useState(null);

    useEffect(() => {
        dispatch(fetchCustomerDetail(id));
        return () => dispatch(clearCustomerDetail());
    }, [dispatch, id]);

    const loadReferrals = useCallback((params = {}) => {
        if (!id) return;
        dispatch(fetchCustomerReferrals({
            id,
            page: params.page || 1,
            search: params.search ?? refSearch,
            status: params.status ?? refStatusFilter,
            per_page: 10,
        }));
    }, [dispatch, id, refSearch, refStatusFilter]);

    useEffect(() => {
        loadReferrals({ page: 1 });
        return () => dispatch(clearCustomerReferrals());
    }, [id]);

    useEffect(() => {
        loadReferrals({ page: 1 });
    }, [refStatusFilter]);

    const loadFrameRequests = useCallback((params = {}) => {
        if (!id) return;
        dispatch(fetchCustomerFrameRequests({
            id,
            page: params.page || 1,
            search: params.search ?? frSearch,
            status: params.status ?? frStatusFilter,
            per_page: 10,
        }));
    }, [dispatch, id, frSearch, frStatusFilter]);

    useEffect(() => {
        loadFrameRequests({ page: 1 });
        return () => dispatch(clearCustomerFrameRequests());
    }, [id]);

    useEffect(() => {
        loadFrameRequests({ page: 1 });
    }, [frStatusFilter]);

    const handleFrSearchChange = (value) => {
        setFrSearch(value);
        if (frSearchTimeout) clearTimeout(frSearchTimeout);
        setFrSearchTimeout(setTimeout(() => {
            loadFrameRequests({ page: 1, search: value });
        }, 400));
    };

    const handleFrPageChange = (page) => {
        loadFrameRequests({ page });
    };

    const handleRefSearchChange = (value) => {
        setRefSearch(value);
        if (refSearchTimeout) clearTimeout(refSearchTimeout);
        setRefSearchTimeout(setTimeout(() => {
            loadReferrals({ page: 1, search: value });
        }, 400));
    };

    const handleRefPageChange = (page) => {
        loadReferrals({ page });
    };

    const handleStatusChange = async (referralId, newStatus) => {
        const result = await dispatch(updateReferralStatus({ customerId: id, referralId, status: newStatus }));
        if (result.error) return alertError('Update Failed', result.payload);
        loadReferrals({ page: referralsPagination.current_page });
        dispatch(fetchCustomerDetail(id));
        alertSuccess('Referral status updated');
    };

    const handleCopyLink = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            alertSuccess('Copied!', 'Referral link copied to clipboard');
        } catch (err) {
            alertError('Copy Failed', 'Could not copy to clipboard');
        }
    };

    const handleCopyCode = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            alertSuccess('Copied!', 'Referral code copied to clipboard');
        } catch (err) {
            alertError('Copy Failed');
        }
    };

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
        setShowDelete(false);
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

            {/* ── Referral System ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                    Referral Program
                </h3>

                {/* Referral Code & Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Referral Code</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xl font-bold text-gray-900 tracking-widest font-mono">{customer.referral_code || '—'}</span>
                            {customer.referral_code && (
                                <button onClick={() => handleCopyCode(customer.referral_code)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors" title="Copy code">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Referral Link</p>
                        {customer.referral_code ? (
                            <div className="flex items-center gap-2 mt-2">
                                <input type="text" readOnly value={`${window.location.origin}/get-started?ref=${customer.referral_code}`} className="flex-1 text-sm text-gray-600 bg-transparent outline-none truncate" />
                                <button onClick={() => handleCopyLink(`${window.location.origin}/get-started?ref=${customer.referral_code}`)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-gray-900 text-white hover:bg-rose-500'}`}>
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button onClick={() => setShareTarget(customer)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-blue-500 transition-colors" title="Share">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 mt-2">No referral code generated</p>
                        )}
                    </div>
                </div>

                {/* Referral Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl p-4 border border-blue-100">
                        <p className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">Total Referrals</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{customer.referral_stats?.total_referrals ?? 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                        <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Successful</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{customer.referral_stats?.successful_referrals ?? 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-xl p-4 border border-amber-100">
                        <p className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Wallet Balance</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">&#8377;{Number(customer.wallet_balance || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Earned: &#8377;{Number(customer.referral_stats?.total_rewards_earned || 0).toLocaleString()}</p>
                    </div>
                </div>

                {/* Referral Search + Filter */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                        <input type="text" value={refSearch} onChange={e => handleRefSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                            placeholder="Search referred users..." />
                    </div>
                    <select value={refStatusFilter} onChange={e => setRefStatusFilter(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="successful">Successful</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>

                {/* Referrals Table */}
                {referralsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <svg className="animate-spin h-7 w-7 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    </div>
                ) : referrals.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                        <p className="text-sm text-gray-400">{refSearch || refStatusFilter ? 'No referrals match your filters' : 'No referrals yet'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-6">
                        <table className="w-full">
                            <thead>
                                <tr className="border-y border-gray-100 bg-gray-50/50">
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-2.5">Referred User</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-2.5">Status</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-2.5">Reward Earned</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-2.5">Date</th>
                                    <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-2.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {referrals.map((ref) => {
                                    const statusColors = { pending: 'bg-amber-50 text-amber-600 ring-amber-500/10', successful: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10', expired: 'bg-red-50 text-red-500 ring-red-500/10' };
                                    const statusLabel = { pending: 'Pending', successful: 'Successful', expired: 'Expired' };
                                    return (
                                        <tr key={ref.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-3">
                                                {ref.referred ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[(ref.referred.id || 0) % avatarColors.length]} flex items-center justify-center`}>
                                                            <span className="text-white text-[10px] font-bold">{getInitials(ref.referred.name)}</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{ref.referred.name}</p>
                                                            <p className="text-[11px] text-gray-400">{ref.referred.email}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">Pending signup...</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${statusColors[ref.status]}`}>
                                                    {statusLabel[ref.status]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-sm text-gray-600">&#8377;{Number(ref.reward_earned || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-xs text-gray-400">{formatDate(ref.created_at)}</span>
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <select
                                                    value={ref.status}
                                                    onChange={e => handleStatusChange(ref.id, e.target.value)}
                                                    className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="successful">Successful</option>
                                                    <option value="expired">Expired</option>
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Referral Pagination */}
                {!referralsLoading && referrals.length > 0 && referralsPagination.last_page > 1 && (() => {
                    const { current_page, last_page, total, per_page } = referralsPagination;
                    const from = (current_page - 1) * per_page + 1;
                    const to = Math.min(current_page * per_page, total);
                    const pages = [];
                    for (let i = 1; i <= last_page; i++) {
                        if (i === 1 || i === last_page || (i >= current_page - 1 && i <= current_page + 1)) pages.push(i);
                        else if (pages[pages.length - 1] !== '...') pages.push('...');
                    }
                    return (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-400">Showing <span className="font-semibold text-gray-600">{from}</span> to <span className="font-semibold text-gray-600">{to}</span> of <span className="font-semibold text-gray-600">{total}</span></p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleRefPageChange(current_page - 1)} disabled={current_page === 1}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
                                {pages.map((page, idx) => page === '...' ? (
                                    <span key={`e-${idx}`} className="px-2 py-1.5 text-xs text-gray-400">...</span>
                                ) : (
                                    <button key={page} onClick={() => handleRefPageChange(page)}
                                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${page === current_page ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{page}</button>
                                ))}
                                <button onClick={() => handleRefPageChange(current_page + 1)} disabled={current_page === last_page}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* ── Custom Frame Requests ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3M2.25 18.75h19.5" /></svg>
                    Custom Frame Layer Requests
                </h3>

                {/* Search + Filter */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                        <input type="text" value={frSearch} onChange={e => handleFrSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                            placeholder="Search frame layer requests..." />
                    </div>
                    <select value={frStatusFilter} onChange={e => setFrStatusFilter(e.target.value)}
                        className="px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                {/* Frame Requests Table */}
                {frameRequestsLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <svg className="animate-spin h-7 w-7 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    </div>
                ) : frameRequests.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3M2.25 18.75h19.5" /></svg>
                        <p className="text-sm text-gray-400">{frSearch || frStatusFilter ? 'No requests match your filters' : 'No frame layer requests yet'}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto -mx-6">
                        <table className="w-full">
                            <thead>
                                <tr className="border-y border-gray-100 bg-gray-50/50">
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-2.5">Title</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-2.5">Status</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-2.5">Delivered Frame</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-2.5">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {frameRequests.map((fr) => {
                                    const frStatusColors = {
                                        pending: 'bg-amber-50 text-amber-600 ring-amber-500/10',
                                        in_progress: 'bg-blue-50 text-blue-600 ring-blue-500/10',
                                        completed: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10',
                                        rejected: 'bg-red-50 text-red-500 ring-red-500/10',
                                    };
                                    const frStatusLabels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', rejected: 'Rejected' };
                                    return (
                                        <tr key={fr.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-3">
                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[250px]">{fr.title}</p>
                                                {fr.description && <p className="text-[11px] text-gray-400 truncate max-w-[250px] mt-0.5">{fr.description}</p>}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${frStatusColors[fr.status] || 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                                                    {frStatusLabels[fr.status] || fr.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                {fr.delivered_file ? (
                                                    <img src={STORAGE_URL + fr.delivered_file} alt="Delivered" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                                ) : (
                                                    <span className="text-sm text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-xs text-gray-400">{formatDate(fr.created_at)}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Frame Requests Pagination */}
                {!frameRequestsLoading && frameRequests.length > 0 && frameRequestsPagination.last_page > 1 && (() => {
                    const { current_page, last_page, total, per_page } = frameRequestsPagination;
                    const from = (current_page - 1) * per_page + 1;
                    const to = Math.min(current_page * per_page, total);
                    const pages = [];
                    for (let i = 1; i <= last_page; i++) {
                        if (i === 1 || i === last_page || (i >= current_page - 1 && i <= current_page + 1)) pages.push(i);
                        else if (pages[pages.length - 1] !== '...') pages.push('...');
                    }
                    return (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-400">Showing <span className="font-semibold text-gray-600">{from}</span> to <span className="font-semibold text-gray-600">{to}</span> of <span className="font-semibold text-gray-600">{total}</span></p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleFrPageChange(current_page - 1)} disabled={current_page === 1}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
                                {pages.map((page, idx) => page === '...' ? (
                                    <span key={`fre-${idx}`} className="px-2 py-1.5 text-xs text-gray-400">...</span>
                                ) : (
                                    <button key={page} onClick={() => handleFrPageChange(page)}
                                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${page === current_page ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{page}</button>
                                ))}
                                <button onClick={() => handleFrPageChange(current_page + 1)} disabled={current_page === last_page}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
                            </div>
                        </div>
                    );
                })()}
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

            {/* ── Share Modal ── */}
            {shareTarget && (() => {
                const referralLink = `${window.location.origin}/get-started?ref=${shareTarget.referral_code}`;
                const shareMessage = `Join using my referral code: ${shareTarget.referral_code}! ${referralLink}`;
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShareTarget(null)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Share Referral</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Share this referral link via social media</p>
                                </div>
                                <button onClick={() => setShareTarget(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 mb-2">Referral Code</p>
                                    <p className="text-3xl font-bold text-gray-900 tracking-widest font-mono">{shareTarget.referral_code}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Referral Link</label>
                                    <div className="flex gap-2">
                                        <input type="text" readOnly value={referralLink} className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none" />
                                        <button onClick={() => handleCopyLink(referralLink)}
                                            className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all">Copy</button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 mb-3">Share via</p>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank')}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 text-green-600 text-sm font-semibold hover:bg-green-100 transition-colors">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                            WhatsApp
                                        </button>
                                        <button onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, '_blank')}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-50 text-sky-600 text-sm font-semibold hover:bg-sky-100 transition-colors">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                            X
                                        </button>
                                        <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank')}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                            Facebook
                                        </button>
                                        <button onClick={() => window.open(`mailto:?subject=${encodeURIComponent('Join using my referral!')}&body=${encodeURIComponent(shareMessage)}`, '_blank')}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-50 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition-colors">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                                            Email
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Modals ── */}
            {showEdit && <EditModal customer={customer} onClose={() => setShowEdit(false)} onSave={handleEdit} />}
            {showDelete && <DeleteModal name={customer.name} onClose={() => setShowDelete(false)} onConfirm={handleDelete} />}
        </div>
    );
}
