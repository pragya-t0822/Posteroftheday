import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, createNotification, updateNotification, deleteNotification, sendNotification } from '../../features/notifications/notificationSlice';
import { fetchCustomers } from '../../features/customers/customerManagementSlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';
import AdvancedFilters from '../../components/AdvancedFilters';
import Pagination from '../../components/Pagination';

const statusConfig = {
    draft: { label: 'Draft', bg: 'bg-gray-100 text-gray-600 ring-gray-200' },
    sent: { label: 'Sent', bg: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10' },
    scheduled: { label: 'Scheduled', bg: 'bg-blue-50 text-blue-600 ring-blue-500/10' },
};

const typeConfig = {
    push: { label: 'Push', bg: 'bg-violet-50 text-violet-600 ring-violet-500/10' },
    email: { label: 'Email', bg: 'bg-amber-50 text-amber-600 ring-amber-500/10' },
    in_app: { label: 'In-App', bg: 'bg-cyan-50 text-cyan-600 ring-cyan-500/10' },
};

const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014';

/* ──────────── Add/Edit Modal ──────────── */
function NotificationModal({ notification, customers, onClose, onSave }) {
    const [form, setForm] = useState({
        title: notification?.title || '',
        message: notification?.message || '',
        target: notification?.target || 'all',
        target_user_ids: notification?.target_user_ids || [],
        subscription_target: notification?.subscription_target || 'all',
        type: notification?.type || 'push',
        scheduled_at: notification?.scheduled_at ? notification.scheduled_at.slice(0, 16) : '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [userSearch, setUserSearch] = useState('');

    const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); };

    const filteredUsers = customers.filter(c => {
        const q = userSearch.toLowerCase();
        return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    });

    const toggleUser = (id) => {
        setForm(f => ({
            ...f,
            target_user_ids: f.target_user_ids.includes(id)
                ? f.target_user_ids.filter(uid => uid !== id)
                : [...f.target_user_ids, id],
        }));
        setErrors(e => ({ ...e, target_user_ids: undefined }));
    };

    const validate = () => {
        const errs = {};
        if (!form.title.trim()) errs.title = 'Title is required';
        if (!form.message.trim()) errs.message = 'Message is required';
        if (form.target === 'specific' && form.target_user_ids.length === 0) errs.target_user_ids = 'Please select at least one user';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        const payload = { ...form };
        if (payload.target === 'all') payload.target_user_ids = [];
        if (payload.target !== 'all') delete payload.subscription_target;
        if (!payload.scheduled_at) delete payload.scheduled_at;
        await onSave(notification ? { id: notification.id, ...payload } : payload);
        setSaving(false);
    };

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{notification ? 'Edit Notification' : 'Send Notification'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{notification ? 'Update notification details' : 'Create and send a new notification'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => set('title', e.target.value)}
                                className={`${inputCls} ${errors.title ? 'border-red-400 ring-2 ring-red-400/10' : ''}`}
                                placeholder="Notification title..."
                            />
                            {errors.title && <p className="text-[11px] text-red-500 mt-1">{errors.title}</p>}
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
                            <textarea
                                value={form.message}
                                onChange={e => set('message', e.target.value)}
                                className={`${inputCls} resize-none ${errors.message ? 'border-red-400 ring-2 ring-red-400/10' : ''}`}
                                rows={4}
                                placeholder="Notification message..."
                            />
                            {errors.message && <p className="text-[11px] text-red-500 mt-1">{errors.message}</p>}
                        </div>

                        {/* Target */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Target</label>
                            <select value={form.target} onChange={e => set('target', e.target.value)} className={inputCls}>
                                <option value="all">All Customers</option>
                                <option value="specific">Specific Users</option>
                            </select>
                        </div>

                        {/* Subscription Target */}
                        {form.target === 'all' && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Subscription Type</label>
                                <select value={form.subscription_target} onChange={e => set('subscription_target', e.target.value)} className={inputCls}>
                                    <option value="all">All Customers</option>
                                    <option value="paid">Paid Subscribers</option>
                                    <option value="renewal">Up for Renewal</option>
                                    <option value="free">Free Tier</option>
                                </select>
                            </div>
                        )}

                        {/* Multi-select users */}
                        {form.target === 'specific' && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Select Users</label>
                                <input
                                    type="text"
                                    value={userSearch}
                                    onChange={e => setUserSearch(e.target.value)}
                                    className={inputCls}
                                    placeholder="Search users..."
                                />
                                <div className={`mt-2 border rounded-xl max-h-40 overflow-y-auto ${errors.target_user_ids ? 'border-red-400 ring-2 ring-red-400/10' : 'border-gray-200'}`}>
                                    {filteredUsers.map(u => (
                                        <label key={u.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                                            <input
                                                type="checkbox"
                                                checked={form.target_user_ids.includes(u.id)}
                                                onChange={() => toggleUser(u.id)}
                                                className="rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                                            />
                                            <span className="text-gray-700">{u.name}</span>
                                            <span className="text-[11px] text-gray-400">{u.email}</span>
                                        </label>
                                    ))}
                                    {filteredUsers.length === 0 && <p className="px-4 py-3 text-sm text-gray-400">No users found</p>}
                                </div>
                                {form.target_user_ids.length > 0 && (
                                    <p className="text-[11px] text-gray-400 mt-1.5">{form.target_user_ids.length} user(s) selected</p>
                                )}
                                {errors.target_user_ids && <p className="text-[11px] text-red-500 mt-1">{errors.target_user_ids}</p>}
                            </div>
                        )}

                        {/* Type */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                            <select value={form.type} onChange={e => set('type', e.target.value)} className={inputCls}>
                                <option value="push">Push</option>
                                <option value="email">Email</option>
                                <option value="in_app">In-App</option>
                            </select>
                        </div>

                        {/* Schedule */}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Schedule for later (optional)</label>
                            <input
                                type="datetime-local"
                                value={form.scheduled_at}
                                onChange={e => set('scheduled_at', e.target.value)}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                            {saving ? 'Saving...' : notification ? 'Update Notification' : 'Send Notification'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function Notifications() {
    const dispatch = useDispatch();
    const { items: notifications, loading, pagination } = useSelector((state) => state.adminNotifications);
    const { items: customers } = useSelector((state) => state.customerManagement);

    const [modalTarget, setModalTarget] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [subscriptionTargetFilter, setSubscriptionTargetFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const loadNotifications = useCallback((params = {}) => {
        dispatch(fetchNotifications({
            page: params.page || 1,
            search: params.search ?? search,
            status: params.status ?? statusFilter,
            type: params.type ?? typeFilter,
            subscription_target: params.subscription_target ?? subscriptionTargetFilter,
            date_from: params.date_from ?? dateFrom,
            date_to: params.date_to ?? dateTo,
            per_page: 10,
        }));
    }, [dispatch, search, statusFilter, typeFilter, subscriptionTargetFilter, dateFrom, dateTo]);

    useEffect(() => {
        loadNotifications({ page: 1 });
    }, [statusFilter, typeFilter, subscriptionTargetFilter, dateFrom, dateTo]);

    useEffect(() => {
        dispatch(fetchCustomers({ per_page: 999 }));
    }, [dispatch]);

    const handleSearchChange = (value) => {
        setSearch(value);
        loadNotifications({ page: 1, search: value });
    };

    const handleFilterChange = (key, value) => {
        if (key === 'status') setStatusFilter(value);
        if (key === 'type') setTypeFilter(value);
        if (key === 'subscription_target') setSubscriptionTargetFilter(value);
    };

    const handleDateChange = (key, value) => {
        if (key === 'date_from') setDateFrom(value);
        if (key === 'date_to') setDateTo(value);
    };

    const handleReset = () => {
        setSearch('');
        setStatusFilter('');
        setTypeFilter('');
        setSubscriptionTargetFilter('');
        setDateFrom('');
        setDateTo('');
        dispatch(fetchNotifications({ page: 1, search: '', status: '', type: '', subscription_target: '', date_from: '', date_to: '', per_page: 10 }));
    };

    const handlePageChange = (page) => {
        loadNotifications({ page });
    };

    const openModal = (notification = null) => {
        setModalTarget(notification);
        setShowModal(true);
    };

    const closeModal = () => {
        setModalTarget(null);
        setShowModal(false);
    };

    const handleSave = async (data) => {
        const isEdit = !!data.id;
        const result = await dispatch(isEdit ? updateNotification(data) : createNotification(data));
        if (result.error) return alertError(isEdit ? 'Update Failed' : 'Create Failed', result.payload);
        closeModal();
        loadNotifications({ page: isEdit ? pagination.current_page : 1 });
        alertSuccess(isEdit ? 'Notification Updated' : 'Notification Created');
    };

    const handleSend = async (id) => {
        const result = await dispatch(sendNotification(id));
        if (result.error) return alertError('Send Failed', result.payload);
        loadNotifications({ page: pagination.current_page });
        alertSuccess('Notification Sent');
    };

    const handleDelete = async (id) => {
        const confirmed = await alertConfirmDelete('this notification');
        if (!confirmed) return;
        const result = await dispatch(deleteNotification(id));
        if (result.error) return alertError('Delete Failed', result.payload);
        loadNotifications({ page: pagination.current_page });
        alertSuccess('Notification Deleted');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h2>
                    <p className="text-sm text-gray-400 mt-1">Send and manage notifications to customers</p>
                </div>
                <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 active:scale-[0.97] transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Send Notification
                </button>
            </div>

            {/* Advanced Filters */}
            <AdvancedFilters
                search={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search by title or message..."
                filters={[
                    {
                        key: 'status',
                        label: 'All Status',
                        value: statusFilter,
                        options: [
                            { value: 'draft', label: 'Draft' },
                            { value: 'sent', label: 'Sent' },
                            { value: 'scheduled', label: 'Scheduled' },
                        ],
                    },
                    {
                        key: 'type',
                        label: 'All Types',
                        value: typeFilter,
                        options: [
                            { value: 'push', label: 'Push' },
                            { value: 'email', label: 'Email' },
                            { value: 'in_app', label: 'In-App' },
                        ],
                    },
                    {
                        key: 'subscription_target',
                        label: 'Subscription Target',
                        value: subscriptionTargetFilter,
                        options: [
                            { value: 'paid', label: 'Paid' },
                            { value: 'renewal', label: 'Renewal' },
                            { value: 'free', label: 'Free' },
                        ],
                    },
                ]}
                onFilterChange={handleFilterChange}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={handleDateChange}
                onReset={handleReset}
            />

            {/* Notifications Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">{search || statusFilter || typeFilter || subscriptionTargetFilter || dateFrom || dateTo ? 'No notifications found' : 'No notifications yet'}</h3>
                        <p className="text-xs text-gray-400 mt-1">{search || statusFilter || typeFilter || subscriptionTargetFilter || dateFrom || dateTo ? 'Try adjusting your search or filters.' : 'Notifications you send will appear here.'}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Title</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Target</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Type</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {notifications.map((n) => (
                                <tr key={n.id} className="group hover:bg-gray-50/60 transition-colors">
                                    {/* Title + Message preview */}
                                    <td className="px-6 py-3.5">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate max-w-[250px]">{n.title}</p>
                                            <p className="text-[11px] text-gray-400 truncate max-w-[250px] mt-0.5">{n.message}</p>
                                        </div>
                                    </td>
                                    {/* Target */}
                                    <td className="px-6 py-3.5">
                                        <span className="text-sm text-gray-600">
                                            {n.target === 'all' ? 'All Customers' : `${n.target_user_ids?.length || 0} Users`}
                                        </span>
                                    </td>
                                    {/* Type */}
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${typeConfig[n.type]?.bg || 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                                            {typeConfig[n.type]?.label || n.type}
                                        </span>
                                    </td>
                                    {/* Status */}
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${statusConfig[n.status]?.bg || 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                                            {statusConfig[n.status]?.label || n.status}
                                        </span>
                                    </td>
                                    {/* Date */}
                                    <td className="px-6 py-3.5">
                                        <span className="text-xs text-gray-500">{formatDateTime(n.sent_at || n.scheduled_at || n.created_at)}</span>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            {/* Edit */}
                                            <button
                                                onClick={() => openModal(n)}
                                                className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                            </button>
                                            {/* Send Now */}
                                            {n.status !== 'sent' && (
                                                <button
                                                    onClick={() => handleSend(n.id)}
                                                    className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-500 transition-colors"
                                                    title="Send Now"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                                    </svg>
                                                </button>
                                            )}
                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(n.id)}
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
                {!loading && notifications.length > 0 && pagination && (
                    <Pagination pagination={pagination} onPageChange={handlePageChange} itemLabel="notifications" />
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <NotificationModal
                    notification={modalTarget}
                    customers={customers}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}

        </div>
    );
}
