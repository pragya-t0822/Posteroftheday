import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWalletBalance, fetchMyWithdrawals, submitWithdrawal } from '../../features/customer/customerWalletSlice';
import { alertSuccess, alertError } from '../../utils/alert';

const MIN_WITHDRAWAL = 10;

const paymentMethods = [
    { value: '', label: 'Select Payment Method' },
    { value: 'upi', label: 'UPI', placeholder: 'Enter UPI ID (e.g. name@upi)' },
    { value: 'bank_transfer', label: 'Bank Transfer', placeholder: 'Enter Bank Name, Account No., IFSC Code' },
    { value: 'paypal', label: 'PayPal', placeholder: 'Enter PayPal email address' },
    { value: 'other', label: 'Other', placeholder: 'Enter payment details' },
];

const statusConfig = {
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-600 ring-amber-500/20' },
    approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-600 ring-emerald-500/20' },
    rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-500 ring-red-500/20' },
};

const formatCurrency = (amt) => '\u20B9' + Number(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '\u2014';

export default function CustomerWalletWithdrawal() {
    const dispatch = useDispatch();
    const { balance, withdrawals, loading, submitting, pagination } = useSelector((state) => state.customerWallet);

    const [form, setForm] = useState({ amount: '', payment_method: '', account_details: '', remarks: '' });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        dispatch(fetchWalletBalance());
        dispatch(fetchMyWithdrawals({ page: 1, per_page: 10 }));
    }, [dispatch]);

    const set = (key, val) => {
        setForm(f => ({ ...f, [key]: val }));
        setErrors(e => ({ ...e, [key]: '' }));
    };

    const selectedMethod = paymentMethods.find(m => m.value === form.payment_method);

    const validate = () => {
        const errs = {};
        const amount = parseFloat(form.amount);

        if (!form.amount || isNaN(amount)) {
            errs.amount = 'Please enter a valid amount';
        } else if (amount < MIN_WITHDRAWAL) {
            errs.amount = `Minimum withdrawal is ${formatCurrency(MIN_WITHDRAWAL)}`;
        } else if (balance !== null && amount > balance) {
            errs.amount = 'Amount exceeds your available balance';
        }

        if (!form.payment_method) {
            errs.payment_method = 'Please select a payment method';
        }

        if (!form.account_details.trim()) {
            errs.account_details = 'Please enter your account details';
        } else if (form.account_details.trim().length < 5) {
            errs.account_details = 'Account details are too short';
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const result = await dispatch(submitWithdrawal({
            amount: parseFloat(form.amount),
            payment_method: form.payment_method,
            account_details: form.account_details.trim(),
            remarks: form.remarks.trim() || null,
        }));

        if (result.error) {
            return alertError('Request Failed', result.payload);
        }

        alertSuccess('Request Submitted', 'Your withdrawal request has been sent for admin approval.');
        setForm({ amount: '', payment_method: '', account_details: '', remarks: '' });
        dispatch(fetchWalletBalance());
    };

    const handlePageChange = (page) => {
        dispatch(fetchMyWithdrawals({ page, per_page: 10 }));
    };

    const hasPendingRequest = withdrawals.some(w => w.status === 'pending');
    const inputCls = (field) =>
        `w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400 outline-none transition-all ${
            errors[field]
                ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
                : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10'
        }`;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Page Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Wallet Withdrawal</h2>
                <p className="text-sm text-gray-500 mt-1">Request to withdraw your wallet balance</p>
            </div>

            {/* Wallet Balance Card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 p-6 text-white shadow-lg">
                <div className="relative z-10">
                    <p className="text-sm font-medium text-white/80">Available Balance</p>
                    <p className="text-4xl font-bold mt-1 tracking-tight">
                        {balance !== null ? formatCurrency(balance) : (
                            <span className="inline-block w-32 h-9 bg-white/20 rounded-lg animate-pulse" />
                        )}
                    </p>
                    {balance !== null && balance < MIN_WITHDRAWAL && (
                        <p className="text-xs text-white/70 mt-2">
                            Minimum withdrawal amount is {formatCurrency(MIN_WITHDRAWAL)}
                        </p>
                    )}
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 right-16 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Withdrawal Form */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 className="text-base font-bold text-gray-900">New Withdrawal Request</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Fill in the details below to submit your request</p>
                        </div>

                        {hasPendingRequest ? (
                            <div className="p-6">
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">Pending Request</p>
                                        <p className="text-xs text-amber-600 mt-0.5">You already have a pending withdrawal request. Please wait for admin approval before submitting a new one.</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Amount */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                        Withdrawal Amount <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">{'\u20B9'}</span>
                                        <input
                                            type="number"
                                            value={form.amount}
                                            onChange={e => set('amount', e.target.value)}
                                            className={inputCls('amount') + ' pl-9'}
                                            placeholder="0.00"
                                            min={MIN_WITHDRAWAL}
                                            max={balance || undefined}
                                            step="0.01"
                                        />
                                    </div>
                                    {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                                    {!errors.amount && balance !== null && (
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            Min: {formatCurrency(MIN_WITHDRAWAL)} &middot; Max: {formatCurrency(balance)}
                                        </p>
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                        Payment Method <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        value={form.payment_method}
                                        onChange={e => set('payment_method', e.target.value)}
                                        className={inputCls('payment_method')}
                                    >
                                        {paymentMethods.map(m => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                    {errors.payment_method && <p className="text-xs text-red-500 mt-1">{errors.payment_method}</p>}
                                </div>

                                {/* Account Details */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                        Account Details <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        value={form.account_details}
                                        onChange={e => set('account_details', e.target.value)}
                                        className={inputCls('account_details') + ' resize-none'}
                                        rows={3}
                                        placeholder={selectedMethod?.placeholder || 'Enter your payment account details'}
                                        maxLength={1000}
                                    />
                                    {errors.account_details && <p className="text-xs text-red-500 mt-1">{errors.account_details}</p>}
                                </div>

                                {/* Remarks */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                        Remarks <span className="text-gray-300">(optional)</span>
                                    </label>
                                    <textarea
                                        value={form.remarks}
                                        onChange={e => set('remarks', e.target.value)}
                                        className={inputCls('remarks') + ' resize-none'}
                                        rows={2}
                                        placeholder="Any additional notes..."
                                        maxLength={500}
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={submitting || (balance !== null && balance < MIN_WITHDRAWAL)}
                                    className="w-full py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Submitting...
                                        </span>
                                    ) : 'Submit Withdrawal Request'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Info Panel */}
                <div className="lg:col-span-2 space-y-5">
                    {/* How it works */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">How It Works</h4>
                        <div className="space-y-3">
                            {[
                                { step: '1', text: 'Fill in the withdrawal form with your preferred payment method and account details.' },
                                { step: '2', text: 'Your request is sent to admin for review and approval.' },
                                { step: '3', text: 'Once approved, the amount is processed to your account.' },
                            ].map(({ step, text }) => (
                                <div key={step} className="flex gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-50 text-rose-500 text-xs font-bold shrink-0">{step}</span>
                                    <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Important Notes */}
                    <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-5">
                        <h4 className="text-sm font-bold text-blue-900 mb-2">Important</h4>
                        <ul className="space-y-1.5 text-xs text-blue-700">
                            <li className="flex items-start gap-1.5">
                                <span className="text-blue-400 mt-0.5">&bull;</span>
                                Minimum withdrawal amount is {formatCurrency(MIN_WITHDRAWAL)}
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span className="text-blue-400 mt-0.5">&bull;</span>
                                Only one pending request is allowed at a time
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span className="text-blue-400 mt-0.5">&bull;</span>
                                Processing may take 1-3 business days
                            </li>
                            <li className="flex items-start gap-1.5">
                                <span className="text-blue-400 mt-0.5">&bull;</span>
                                Ensure your account details are accurate
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Withdrawal History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-gray-900">Withdrawal History</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Track the status of your withdrawal requests</p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <svg className="animate-spin h-7 w-7 text-rose-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : withdrawals.length === 0 ? (
                    <div className="py-14 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900">No withdrawal requests yet</p>
                        <p className="text-xs text-gray-400 mt-0.5">Your withdrawal history will appear here</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile cards / Desktop table */}
                        <div className="hidden sm:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Amount</th>
                                        <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Method</th>
                                        <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                                        <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                                        <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Admin Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {withdrawals.map((w) => (
                                        <tr key={w.id} className="hover:bg-gray-50/60 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <span className="text-sm font-bold text-gray-900">{formatCurrency(w.amount)}</span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="text-sm text-gray-600 capitalize">{w.payment_method?.replace('_', ' ')}</span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${statusConfig[w.status]?.cls || 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                                                    {statusConfig[w.status]?.label || w.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="text-xs text-gray-500">{formatDate(w.created_at)}</span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <span className="text-xs text-gray-500 max-w-[200px] truncate block">{w.admin_remarks || '\u2014'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile view */}
                        <div className="sm:hidden divide-y divide-gray-100">
                            {withdrawals.map((w) => (
                                <div key={w.id} className="p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(w.amount)}</span>
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${statusConfig[w.status]?.cls}`}>
                                            {statusConfig[w.status]?.label || w.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span className="capitalize">{w.payment_method?.replace('_', ' ')}</span>
                                        <span>{formatDate(w.created_at)}</span>
                                    </div>
                                    {w.admin_remarks && (
                                        <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">{w.admin_remarks}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                                <p className="text-xs text-gray-400">
                                    Page {pagination.current_page} of {pagination.last_page}
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
