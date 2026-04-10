import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFollowUps, createFollowUp, updateFollowUp, deleteFollowUp, markFollowUpCompleted } from '../../features/followUps/followUpSlice';
import { fetchCustomers } from '../../features/customers/customerManagementSlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';
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

const statusConfig = {
    pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-600 ring-amber-500/10' },
    completed: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10' },
    missed: { label: 'Missed', bg: 'bg-red-50 text-red-500 ring-red-500/10' },
};

const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014';

/* ──────────── Add/Edit Modal ──────────── */
function FollowUpModal({ followUp, customers, onClose, onSave }) {
    const [form, setForm] = useState({
        customer_id: followUp?.customer_id || '',
        notes: followUp?.notes || '',
        scheduled_at: followUp?.scheduled_at ? followUp.scheduled_at.slice(0, 16) : '',
        status: followUp?.status || 'pending',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [customerSearch, setCustomerSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); };

    const selectedCustomer = customers.find(c => c.id === Number(form.customer_id));

    const filteredCustomers = customers.filter(c => {
        const q = customerSearch.toLowerCase();
        return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    });

    const validate = () => {
        const errs = {};
        if (!form.customer_id) errs.customer_id = 'Please select a customer';
        if (!form.scheduled_at) errs.scheduled_at = 'Please select date and time';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        await onSave(followUp ? { id: followUp.id, ...form } : form);
        setSaving(false);
    };

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{followUp ? 'Edit Follow-Up' : 'Add Follow-Up'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{followUp ? 'Update follow-up details' : 'Schedule a new follow-up with a customer'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-5">
                        {/* Customer Select (SearchableSelect inline) */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Customer</label>
                            <div className="relative">
                                <div
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className={`${inputCls} cursor-pointer flex items-center justify-between ${errors.customer_id ? 'border-red-400 ring-2 ring-red-400/10' : ''}`}
                                >
                                    <span className={selectedCustomer ? 'text-gray-900' : 'text-gray-400'}>
                                        {selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.email})` : 'Select a customer...'}
                                    </span>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                                {showDropdown && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
                                        <div className="p-2 border-b border-gray-100">
                                            <input
                                                type="text"
                                                value={customerSearch}
                                                onChange={e => setCustomerSearch(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 transition-all"
                                                placeholder="Search customers..."
                                                autoFocus
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className="overflow-y-auto max-h-48">
                                            {filteredCustomers.length === 0 ? (
                                                <p className="px-4 py-3 text-sm text-gray-400">No customers found</p>
                                            ) : (
                                                filteredCustomers.map(c => (
                                                    <button
                                                        key={c.id}
                                                        type="button"
                                                        onClick={() => { set('customer_id', c.id); setShowDropdown(false); setCustomerSearch(''); }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors flex items-center gap-3 ${Number(form.customer_id) === c.id ? 'bg-rose-50 text-rose-600' : 'text-gray-700'}`}
                                                    >
                                                        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(c.id)} flex items-center justify-center shrink-0`}>
                                                            <span className="text-white text-[10px] font-bold">{getInitials(c.name)}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium truncate">{c.name}</p>
                                                            <p className="text-[11px] text-gray-400 truncate">{c.email}</p>
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {errors.customer_id && <p className="text-[11px] text-red-500 mt-1">{errors.customer_id}</p>}
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Notes</label>
                            <textarea
                                value={form.notes}
                                onChange={e => set('notes', e.target.value)}
                                className={inputCls + ' resize-none'}
                                rows={3}
                                placeholder="Add follow-up notes..."
                            />
                        </div>

                        {/* Date & Time */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Date & Time</label>
                            <input
                                type="datetime-local"
                                value={form.scheduled_at}
                                onChange={e => set('scheduled_at', e.target.value)}
                                className={`${inputCls} ${errors.scheduled_at ? 'border-red-400 ring-2 ring-red-400/10' : ''}`}
                            />
                            {errors.scheduled_at && <p className="text-[11px] text-red-500 mt-1">{errors.scheduled_at}</p>}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="missed">Missed</option>
                            </select>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                            {saving ? 'Saving...' : followUp ? 'Update Follow-Up' : 'Create Follow-Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function FollowUps() {
    const dispatch = useDispatch();
    const { items: followUps, loading, pagination } = useSelector((state) => state.followUps);
    const { items: customers } = useSelector((state) => state.customerManagement);

    const [modalTarget, setModalTarget] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const loadFollowUps = useCallback((params = {}) => {
        dispatch(fetchFollowUps({
            page: params.page || 1,
            search: params.search ?? search,
            status: params.status ?? statusFilter,
            date_from: params.date_from ?? dateFrom,
            date_to: params.date_to ?? dateTo,
            per_page: 10,
        }));
    }, [dispatch, search, statusFilter, dateFrom, dateTo]);

    useEffect(() => {
        loadFollowUps({ page: 1 });
    }, [statusFilter, dateFrom, dateTo]);

    useEffect(() => {
        dispatch(fetchCustomers({ per_page: 999 }));
    }, [dispatch]);

    const handleSearchChange = (value) => {
        setSearch(value);
        loadFollowUps({ page: 1, search: value });
    };

    const handleFilterChange = (key, value) => {
        if (key === 'status') setStatusFilter(value);
    };

    const handleDateChange = (key, value) => {
        if (key === 'date_from') setDateFrom(value);
        if (key === 'date_to') setDateTo(value);
    };

    const handleReset = () => {
        setSearch('');
        setStatusFilter('');
        setDateFrom('');
        setDateTo('');
        dispatch(fetchFollowUps({ page: 1, search: '', status: '', date_from: '', date_to: '', per_page: 10 }));
    };

    const handlePageChange = (page) => {
        loadFollowUps({ page });
    };

    const openModal = (followUp = null) => {
        setModalTarget(followUp);
        setShowModal(true);
    };

    const closeModal = () => {
        setModalTarget(null);
        setShowModal(false);
    };

    const handleSave = async (data) => {
        const isEdit = !!data.id;
        const result = await dispatch(isEdit ? updateFollowUp(data) : createFollowUp(data));
        if (result.error) return alertError(isEdit ? 'Update Failed' : 'Create Failed', result.payload);
        closeModal();
        loadFollowUps({ page: isEdit ? pagination.current_page : 1 });
        alertSuccess(isEdit ? 'Follow-Up Updated' : 'Follow-Up Created');
    };

    const handleComplete = async (id) => {
        const result = await dispatch(markFollowUpCompleted(id));
        if (result.error) return alertError('Action Failed', result.payload);
        loadFollowUps({ page: pagination.current_page });
        alertSuccess('Follow-Up Completed');
    };

    const handleDelete = async (id) => {
        const confirmed = await alertConfirmDelete('this follow-up');
        if (!confirmed) return;
        const result = await dispatch(deleteFollowUp(id));
        if (result.error) return alertError('Delete Failed', result.payload);
        loadFollowUps({ page: pagination.current_page });
        alertSuccess('Follow-Up Deleted');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Follow-Ups</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage scheduled customer follow-ups</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 active:scale-[0.97] transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Follow-Up
                </button>
            </div>

            {/* Advanced Filters */}
            <AdvancedFilters
                search={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search by customer name or notes..."
                filters={[
                    {
                        key: 'status',
                        label: 'All Status',
                        value: statusFilter,
                        options: [
                            { value: 'pending', label: 'Pending' },
                            { value: 'completed', label: 'Completed' },
                            { value: 'missed', label: 'Missed' },
                        ],
                    },
                ]}
                onFilterChange={handleFilterChange}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={handleDateChange}
                onReset={handleReset}
            />

            {/* Follow-Ups Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : followUps.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">{search || statusFilter || dateFrom || dateTo ? 'No follow-ups found' : 'No follow-ups yet'}</h3>
                        <p className="text-xs text-gray-400 mt-1">{search || statusFilter || dateFrom || dateTo ? 'Try adjusting your search or filters.' : 'Scheduled follow-ups will appear here.'}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Customer</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Notes</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Scheduled Date & Time</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {followUps.map((f) => (
                                <tr key={f.id} className="group hover:bg-gray-50/60 transition-colors">
                                    {/* Customer */}
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(f.customer?.id)} flex items-center justify-center shadow-sm`}>
                                                <span className="text-white text-xs font-bold">{getInitials(f.customer?.name)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{f.customer?.name || '\u2014'}</p>
                                                <p className="text-[11px] text-gray-400 truncate">{f.customer?.email || '\u2014'}</p>
                                                {f.customer?.phone && (
                                                    <p className="text-[11px] text-gray-400 truncate">{f.customer.phone}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    {/* Notes */}
                                    <td className="px-6 py-3.5">
                                        <p className="text-sm text-gray-600 truncate max-w-[250px]">{f.notes || '\u2014'}</p>
                                    </td>
                                    {/* Scheduled Date & Time */}
                                    <td className="px-6 py-3.5">
                                        <span className="text-xs text-gray-500">{formatDateTime(f.scheduled_at)}</span>
                                    </td>
                                    {/* Status */}
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${statusConfig[f.status]?.bg || 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                                            {statusConfig[f.status]?.label || f.status}
                                        </span>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            {/* Edit */}
                                            <button
                                                onClick={() => openModal(f)}
                                                className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                            </button>
                                            {/* Mark Complete */}
                                            {f.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleComplete(f.id)}
                                                    className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-500 transition-colors"
                                                    title="Mark as Completed"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                            )}
                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(f.id)}
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
                {!loading && followUps.length > 0 && pagination && (
                    <Pagination pagination={pagination} onPageChange={handlePageChange} itemLabel="follow-ups" />
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <FollowUpModal
                    followUp={modalTarget}
                    customers={customers}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
