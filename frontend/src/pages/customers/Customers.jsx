import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../features/customers/customerManagementSlice';

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

/* ──────────── Customer Modal ──────────── */
function CustomerModal({ customer, onClose, onSave }) {
    const [form, setForm] = useState({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        status: customer?.status || 'active',
        password: '',
    });
    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...form };
        if (!data.password) delete data.password;
        onSave(customer ? { id: customer.id, ...data } : data);
    };

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{customer ? 'Edit Customer' : 'New Customer'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{customer ? 'Update customer details' : 'Add a new customer account'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {customer && (
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(customer.id)} flex items-center justify-center`}>
                                <span className="text-white text-sm font-bold">{getInitials(customer.name)}</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                                <p className="text-xs text-gray-400">{customer.email}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="John Doe" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
                            <input type="text" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="+91 9876543210" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="john@example.com" required />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">
                                Password {customer && <span className="text-gray-400 font-normal">(leave blank to keep)</span>}
                            </label>
                            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className={inputCls} placeholder={customer ? '••••••••' : 'Min 8 characters'}
                                {...(!customer && { required: true, minLength: 8 })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all">
                            {customer ? 'Update Customer' : 'Create Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────── Delete Modal ──────────── */
function DeleteModal({ customer, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center">Delete Customer</h3>
                <p className="text-sm text-gray-500 text-center mt-2">
                    Are you sure you want to delete <span className="font-semibold text-gray-700">{customer.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => { onConfirm(customer.id); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ──────────── View Modal ──────────── */
function ViewModal({ customer, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">Customer Details</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getAvatarColor(customer.id)} flex items-center justify-center shadow-sm`}>
                            <span className="text-white text-lg font-bold">{getInitials(customer.name)}</span>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900">{customer.name}</p>
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${customer.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                {customer.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            <span className="text-sm text-gray-600">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span className="text-sm text-gray-600">{customer.phone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <span className="text-sm text-gray-600">
                                Joined {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ──────────── Pagination ──────────── */
function Pagination({ pagination, onPageChange }) {
    const { current_page, last_page, total, per_page } = pagination;
    if (last_page <= 1) return null;

    const from = (current_page - 1) * per_page + 1;
    const to = Math.min(current_page * per_page, total);

    // Build page numbers with ellipsis
    const pages = [];
    for (let i = 1; i <= last_page; i++) {
        if (i === 1 || i === last_page || (i >= current_page - 1 && i <= current_page + 1)) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return (
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <p className="text-xs text-gray-400">
                Showing <span className="font-semibold text-gray-600">{from}</span> to <span className="font-semibold text-gray-600">{to}</span> of <span className="font-semibold text-gray-600">{total}</span> customers
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(current_page - 1)}
                    disabled={current_page === 1}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Previous
                </button>
                {pages.map((page, idx) =>
                    page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-xs text-gray-400">...</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                                page === current_page
                                    ? 'bg-gray-900 text-white'
                                    : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}
                <button
                    onClick={() => onPageChange(current_page + 1)}
                    disabled={current_page === last_page}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function Customers() {
    const dispatch = useDispatch();
    const { items: customers, loading, pagination } = useSelector((state) => state.customerManagement);
    const [modal, setModal] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);

    const loadCustomers = useCallback((params = {}) => {
        dispatch(fetchCustomers({
            page: params.page || 1,
            search: params.search ?? search,
            status: params.status ?? statusFilter,
            per_page: 10,
        }));
    }, [dispatch, search, statusFilter]);

    useEffect(() => {
        loadCustomers({ page: 1 });
    }, [statusFilter]);

    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => {
            loadCustomers({ page: 1, search: value });
        }, 400));
    };

    const handlePageChange = (page) => {
        loadCustomers({ page });
    };

    const handleSave = async (data) => {
        if (data.id) {
            await dispatch(updateCustomer(data));
        } else {
            await dispatch(createCustomer(data));
        }
        setModal(null);
        loadCustomers({ page: pagination.current_page });
    };

    const handleDelete = async (id) => {
        await dispatch(deleteCustomer(id));
        loadCustomers({ page: pagination.current_page });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Customers</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage and monitor your customer accounts</p>
                </div>
                <button
                    onClick={() => setModal('new')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98]"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                    Add New Customer
                </button>
            </div>

            {/* Search + Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={e => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                            placeholder="Search customers..."
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

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
                        <h3 className="text-sm font-semibold text-gray-900">{search || statusFilter ? 'No customers found' : 'No customers yet'}</h3>
                        <p className="text-xs text-gray-400 mt-1">{search || statusFilter ? 'Try adjusting your search or filter.' : 'Add your first customer to get started.'}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Name</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Email</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Phone</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Created Date</th>
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
                                            <span className="text-sm font-semibold text-gray-900">{c.name}</span>
                                        </div>
                                    </td>
                                    {/* Email */}
                                    <td className="px-6 py-3.5">
                                        <span className="text-sm text-gray-600">{c.email}</span>
                                    </td>
                                    {/* Phone */}
                                    <td className="px-6 py-3.5">
                                        <span className="text-sm text-gray-600">{c.phone || '—'}</span>
                                    </td>
                                    {/* Status */}
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${
                                            c.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-600 ring-emerald-500/10'
                                                : 'bg-red-50 text-red-500 ring-red-500/10'
                                        }`}>
                                            {c.status === 'active' ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    {/* Created Date */}
                                    <td className="px-6 py-3.5">
                                        <span className="text-xs text-gray-400">
                                            {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                        </span>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* View */}
                                            <button
                                                onClick={() => setViewTarget(c)}
                                                className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                                                title="View"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </button>
                                            {/* Edit */}
                                            <button
                                                onClick={() => setModal(c)}
                                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                                                </svg>
                                            </button>
                                            {/* Delete */}
                                            <button
                                                onClick={() => setDeleteTarget(c)}
                                                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
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
                    <Pagination pagination={pagination} onPageChange={handlePageChange} />
                )}
            </div>

            {/* Modals */}
            {modal && (
                <CustomerModal
                    customer={modal === 'new' ? null : modal}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}
            {viewTarget && (
                <ViewModal
                    customer={viewTarget}
                    onClose={() => setViewTarget(null)}
                />
            )}
            {deleteTarget && (
                <DeleteModal
                    customer={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}
