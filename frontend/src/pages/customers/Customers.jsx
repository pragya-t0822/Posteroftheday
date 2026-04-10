import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCustomers, updateCustomer, deleteCustomer, toggleCustomerStatus } from '../../features/customers/customerManagementSlice';
import { alertSuccess, alertError, alertConfirmDelete, alertConfirm } from '../../utils/alert';
import AdvancedFilters from '../../components/AdvancedFilters';
import Pagination from '../../components/Pagination';

const avatarColors = [
    'from-rose-500 to-pink-600',
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-cyan-500 to-blue-600',
];

function getAvatarColor(id) {
    return avatarColors[(id || 0) % avatarColors.length];
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ──────────── Edit Customer Modal ──────────── */
function EditCustomerModal({ customer, onClose, onSave }) {
    const [form, setForm] = useState({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        password: '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); };

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Name is required';
        if (!form.email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
        if (form.phone && !/^[\d\s+\-()]{7,20}$/.test(form.phone)) errs.phone = 'Invalid phone number';
        if (form.password && form.password.length < 8) errs.password = 'Password must be at least 8 characters';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        const data = { id: customer.id, name: form.name.trim(), email: form.email.trim(), phone: form.phone };
        if (form.password) data.password = form.password;
        await onSave(data);
        setSaving(false);
    };

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';
    const errCls = 'border-red-400 ring-2 ring-red-400/10';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Edit Customer</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Update customer details</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(customer.id)} flex items-center justify-center`}>
                            <span className="text-white text-sm font-bold">{getInitials(customer.name)}</span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-400">{customer.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={`${inputCls} ${errors.name ? errCls : ''}`} placeholder="John Doe" />
                            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                            <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)} className={`${inputCls} ${errors.phone ? errCls : ''}`} placeholder="+91 9876543210" />
                            {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={`${inputCls} ${errors.email ? errCls : ''}`} placeholder="john@example.com" />
                        {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                        </label>
                        <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className={`${inputCls} ${errors.password ? errCls : ''}`} placeholder="••••••••" />
                        {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>}
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                            {saving ? 'Saving...' : 'Update Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function Customers() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items: customers, loading, pagination } = useSelector((state) => state.customerManagement);
    const [editTarget, setEditTarget] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [subscriptionType, setSubscriptionType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const loadCustomers = useCallback((page = 1, overrides = {}) => {
        dispatch(fetchCustomers({
            page,
            search: overrides.search ?? search,
            status: overrides.status ?? statusFilter,
            subscription_type: overrides.subscription_type ?? subscriptionType,
            date_from: overrides.date_from ?? dateFrom,
            date_to: overrides.date_to ?? dateTo,
            per_page: 10,
        }));
    }, [dispatch, search, statusFilter, subscriptionType, dateFrom, dateTo]);

    useEffect(() => {
        loadCustomers(1);
    }, [loadCustomers]);

    const handleSearchChange = (value) => {
        setSearch(value);
    };

    const handleFilterChange = (key, value) => {
        if (key === 'status') setStatusFilter(value);
        if (key === 'subscription_type') setSubscriptionType(value);
    };

    const handleDateChange = (key, value) => {
        if (key === 'date_from') setDateFrom(value);
        if (key === 'date_to') setDateTo(value);
    };

    const handleReset = () => {
        setSearch('');
        setStatusFilter('');
        setSubscriptionType('');
        setDateFrom('');
        setDateTo('');
    };

    const handlePageChange = (page) => {
        loadCustomers(page);
    };

    const handleSave = async (data) => {
        const result = await dispatch(updateCustomer(data));
        if (result.error) return alertError('Update Failed', result.payload);
        setEditTarget(null);
        loadCustomers(pagination.current_page);
        alertSuccess('Customer Updated');
    };

    const handleToggleStatus = async (customer) => {
        const label = customer.status === 'active' ? 'Deactivate' : 'Activate';
        const confirmed = await alertConfirm(label, `${label} ${customer.name}?`, label);
        if (!confirmed) return;
        const result = await dispatch(toggleCustomerStatus(customer.id));
        if (result.error) return alertError(`${label} Failed`, result.payload);
        alertSuccess(`Customer ${label}d`);
    };

    const handleDelete = async (customer) => {
        const confirmed = await alertConfirmDelete(customer.name);
        if (!confirmed) return;
        const result = await dispatch(deleteCustomer(customer.id));
        if (result.error) return alertError('Delete Failed', result.payload);
        loadCustomers(pagination.current_page);
        alertSuccess('Customer Deleted');
    };

    const getSubscriptionEnd = (customer) => {
        const activeSub = customer.subscriptions?.[0];
        if (activeSub?.ends_at) return formatDate(activeSub.ends_at);
        return <span className="text-gray-300">Free</span>;
    };

    const hasFilters = search || statusFilter || subscriptionType || dateFrom || dateTo;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage and monitor your customer accounts</p>
                </div>
            </div>

            {/* Advanced Filters */}
            <AdvancedFilters
                search={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search by name, email, or phone..."
                filters={[
                    {
                        key: 'subscription_type',
                        label: 'All Users',
                        value: subscriptionType,
                        options: [
                            { value: 'membership', label: 'Membership Users' },
                            { value: 'renewal', label: 'Renewal Users' },
                            { value: 'free', label: 'Free Users' },
                        ],
                    },
                    {
                        key: 'status',
                        label: 'All Status',
                        value: statusFilter,
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                        ],
                    },
                ]}
                onFilterChange={handleFilterChange}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={handleDateChange}
                onReset={handleReset}
            />

            {/* Customers Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : customers.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">{hasFilters ? 'No customers found' : 'No customers yet'}</h3>
                        <p className="text-xs text-gray-400 mt-1">{hasFilters ? 'Try adjusting your search or filter.' : 'Customers will appear here once they register.'}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Name</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Mobile Number</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Subscription End Date</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Registration Date</th>
                                <th className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {customers.map((c) => (
                                <tr key={c.id} className="group hover:bg-gray-50/60 transition-colors">
                                    {/* Name */}
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(c.id)} flex items-center justify-center shadow-sm`}>
                                                <span className="text-white text-xs font-bold">{getInitials(c.name)}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                                                <p className="text-[11px] text-gray-400">{c.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Mobile Number */}
                                    <td className="px-6 py-3.5">
                                        <span className="text-sm text-gray-600">{c.phone || '—'}</span>
                                    </td>
                                    {/* Subscription End Date */}
                                    <td className="px-6 py-3.5">
                                        <span className="text-sm text-gray-600">{getSubscriptionEnd(c)}</span>
                                    </td>
                                    {/* Registration Date */}
                                    <td className="px-6 py-3.5">
                                        <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                                    </td>
                                    {/* Status */}
                                    <td className="px-6 py-3.5 text-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${c.status === 'active' ? 'bg-emerald-50 text-emerald-600 ring-emerald-500/10' : 'bg-red-50 text-red-500 ring-red-500/10'}`}>
                                            {c.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            {/* View */}
                                            <button
                                                onClick={() => navigate(`/customers/${c.id}`)}
                                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors"
                                                title="View"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </button>
                                            {/* Edit */}
                                            <button
                                                onClick={() => setEditTarget(c)}
                                                className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                                                </svg>
                                            </button>
                                            {/* Deactivate / Activate */}
                                            <button
                                                onClick={() => handleToggleStatus(c)}
                                                className={`p-2 rounded-lg transition-colors ${c.status === 'active' ? 'hover:bg-orange-50 text-orange-500 hover:text-orange-700' : 'hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700'}`}
                                                title={c.status === 'active' ? 'Deactivate' : 'Activate'}
                                            >
                                                {c.status === 'active' ? (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                )}
                                            </button>
                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(c)}
                                                className="p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                                                title="Delete"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {!loading && customers.length > 0 && (
                    <Pagination pagination={pagination} onPageChange={handlePageChange} itemLabel="customers" />
                )}
            </div>

            {/* Edit Modal */}
            {editTarget && (
                <EditCustomerModal
                    customer={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={handleSave}
                />
            )}

        </div>
    );
}
