import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWithdrawals, approveWithdrawal, rejectWithdrawal, deleteWithdrawal } from '../../features/walletWithdrawals/walletWithdrawalSlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';
import AdvancedFilters from '../../components/AdvancedFilters';
import Pagination from '../../components/Pagination';

const statusConfig = {
    pending: { label: 'Pending', bg: 'bg-amber-50 text-amber-600 ring-amber-500/10' },
    approved: { label: 'Approved', bg: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10' },
    rejected: { label: 'Rejected', bg: 'bg-red-50 text-red-500 ring-red-500/10' },
};

const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'upi', label: 'UPI' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'other', label: 'Other' },
];

const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014';
const formatCurrency = (amt) => '\u20B9' + Number(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

/* ──────────── Review Modal ──────────── */
function ReviewModal({ withdrawal, onClose, onApprove, onReject }) {
    const [adminRemarks, setAdminRemarks] = useState('');
    const [processing, setProcessing] = useState(false);

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    const handleApprove = async () => {
        setProcessing(true);
        await onApprove(withdrawal.id, adminRemarks);
        setProcessing(false);
    };

    const handleReject = async () => {
        if (!adminRemarks.trim()) return alertError('Validation', 'Please provide a reason for rejection');
        setProcessing(true);
        await onReject(withdrawal.id, adminRemarks);
        setProcessing(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Review Withdrawal Request</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Approve or reject this withdrawal</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Request details */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Customer</span>
                            <span className="text-sm font-semibold text-gray-900">{withdrawal.user?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Amount</span>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(withdrawal.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Payment Method</span>
                            <span className="text-sm text-gray-700 capitalize">{withdrawal.payment_method?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Account Details</span>
                            <span className="text-sm text-gray-700 text-right max-w-[200px]">{withdrawal.account_details}</span>
                        </div>
                        {withdrawal.remarks && (
                            <div className="flex justify-between">
                                <span className="text-xs text-gray-500">Customer Remarks</span>
                                <span className="text-sm text-gray-700 text-right max-w-[200px]">{withdrawal.remarks}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-xs text-gray-500">Requested</span>
                            <span className="text-xs text-gray-500">{formatDate(withdrawal.created_at)}</span>
                        </div>
                    </div>

                    {/* Admin remarks */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Admin Remarks {withdrawal.status === 'pending' && <span className="text-red-400">(required for rejection)</span>}</label>
                        <textarea
                            value={adminRemarks}
                            onChange={e => setAdminRemarks(e.target.value)}
                            className={inputCls + ' resize-none'}
                            rows={3}
                            placeholder="Add your remarks..."
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    {withdrawal.status === 'pending' && (
                        <>
                            <button onClick={handleReject} disabled={processing} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all disabled:opacity-50">
                                {processing ? 'Processing...' : 'Reject'}
                            </button>
                            <button onClick={handleApprove} disabled={processing} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50">
                                {processing ? 'Processing...' : 'Approve'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function WalletWithdrawals() {
    const dispatch = useDispatch();
    const { items: withdrawals, loading, pagination } = useSelector((state) => state.walletWithdrawals);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [reviewTarget, setReviewTarget] = useState(null);
    const loadData = useCallback((params = {}) => {
        dispatch(fetchWithdrawals({
            page: params.page || 1,
            search: params.search ?? search,
            status: params.status ?? statusFilter,
            payment_method: params.payment_method ?? methodFilter,
            date_from: params.date_from ?? dateFrom,
            date_to: params.date_to ?? dateTo,
            per_page: 10,
        }));
    }, [dispatch, search, statusFilter, methodFilter, dateFrom, dateTo]);

    useEffect(() => {
        loadData({ page: 1 });
    }, [statusFilter, methodFilter, dateFrom, dateTo]);

    const handleSearchChange = (value) => {
        setSearch(value);
        loadData({ page: 1, search: value });
    };

    const handleFilterChange = (key, value) => {
        if (key === 'status') setStatusFilter(value);
        if (key === 'payment_method') setMethodFilter(value);
    };

    const handleDateChange = (key, value) => {
        if (key === 'date_from') setDateFrom(value);
        if (key === 'date_to') setDateTo(value);
    };

    const handleReset = () => {
        setSearch(''); setStatusFilter(''); setMethodFilter(''); setDateFrom(''); setDateTo('');
        dispatch(fetchWithdrawals({ page: 1, per_page: 10 }));
    };

    const handlePageChange = (page) => loadData({ page });

    const handleApprove = async (id, adminRemarks) => {
        const result = await dispatch(approveWithdrawal({ id, admin_remarks: adminRemarks }));
        if (result.error) return alertError('Approve Failed', result.payload);
        setReviewTarget(null);
        loadData({ page: pagination.current_page });
        alertSuccess('Withdrawal Approved');
    };

    const handleReject = async (id, adminRemarks) => {
        const result = await dispatch(rejectWithdrawal({ id, admin_remarks: adminRemarks }));
        if (result.error) return alertError('Reject Failed', result.payload);
        setReviewTarget(null);
        loadData({ page: pagination.current_page });
        alertSuccess('Withdrawal Rejected');
    };

    const handleDelete = async (id) => {
        const confirmed = await alertConfirmDelete('this withdrawal request');
        if (!confirmed) return;
        const result = await dispatch(deleteWithdrawal(id));
        if (result.error) return alertError('Delete Failed', result.payload);
        loadData({ page: pagination.current_page });
        alertSuccess('Withdrawal Deleted');
    };

    const hasFilters = search || statusFilter || methodFilter || dateFrom || dateTo;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Wallet Withdrawals</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage customer withdrawal requests</p>
                </div>
            </div>

            {/* Filters */}
            <AdvancedFilters
                search={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search by customer, method, or details..."
                filters={[
                    { key: 'status', label: 'All Status', value: statusFilter, options: [
                        { value: 'pending', label: 'Pending' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'rejected', label: 'Rejected' },
                    ]},
                    { key: 'payment_method', label: 'All Methods', value: methodFilter, options: paymentMethods },
                ]}
                onFilterChange={handleFilterChange}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={handleDateChange}
                onReset={handleReset}
            />

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : withdrawals.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">{hasFilters ? 'No withdrawals found' : 'No withdrawal requests yet'}</h3>
                        <p className="text-xs text-gray-400 mt-1">{hasFilters ? 'Try adjusting your search or filters.' : 'Customer withdrawal requests will appear here.'}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Customer</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Amount</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Method</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {withdrawals.map((w) => (
                                <tr key={w.id} className="group hover:bg-gray-50/60 transition-colors">
                                    <td className="px-6 py-3.5">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{w.user?.name || '\u2014'}</p>
                                            <p className="text-[11px] text-gray-400">{w.user?.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(w.amount)}</span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-sm text-gray-600 capitalize">{w.payment_method?.replace('_', ' ')}</span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${statusConfig[w.status]?.bg || 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                                            {statusConfig[w.status]?.label || w.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3.5">
                                        <span className="text-xs text-gray-500">{formatDate(w.created_at)}</span>
                                    </td>
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            {/* Review */}
                                            <button
                                                onClick={() => setReviewTarget(w)}
                                                className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700 transition-colors"
                                                title="Review"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </button>
                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(w.id)}
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

                {!loading && withdrawals.length > 0 && (
                    <Pagination pagination={pagination} onPageChange={handlePageChange} itemLabel="withdrawals" />
                )}
            </div>

            {/* Review Modal */}
            {reviewTarget && (
                <ReviewModal
                    withdrawal={reviewTarget}
                    onClose={() => setReviewTarget(null)}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            )}

        </div>
    );
}
