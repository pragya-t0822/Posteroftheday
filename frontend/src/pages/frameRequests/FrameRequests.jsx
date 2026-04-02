import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFrameRequests, updateFrameRequest, deleteFrameRequest } from '../../features/frameRequests/frameRequestSlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';

const STORAGE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') + '/storage/';

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
    in_progress: { label: 'In Progress', bg: 'bg-blue-50 text-blue-600 ring-blue-500/10' },
    completed: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10' },
    rejected: { label: 'Rejected', bg: 'bg-red-50 text-red-500 ring-red-500/10' },
};

/* ──────────── Process Modal ──────────── */
function ProcessModal({ request, onClose, onSave }) {
    const [form, setForm] = useState({
        status: request?.status || 'pending',
        admin_notes: request?.admin_notes || '',
        frame_layer_id: request?.frame_layer_id || '',
    });
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [saving, setSaving] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleFileChange = (selectedFile) => {
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target.result);
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith('image/')) {
            handleFileChange(droppedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const formData = new FormData();
        formData.append('status', form.status);
        formData.append('admin_notes', form.admin_notes);
        if (file) formData.append('delivered_file', file);
        if (form.frame_layer_id) formData.append('frame_layer_id', form.frame_layer_id);
        await onSave({ id: request.id, formData });
        setSaving(false);
    };

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Process Frame Layer Request</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Review and fulfill the customer's frame layer request</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-5">
                        {/* Request Info */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Request Information</h4>
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(request.customer?.id)} flex items-center justify-center shadow-sm`}>
                                    <span className="text-white text-xs font-bold">{getInitials(request.customer?.name)}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{request.customer?.name || '—'}</p>
                                    <p className="text-xs text-gray-400">{request.customer?.email || '—'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Title</p>
                                <p className="text-sm text-gray-900 mt-0.5">{request.title}</p>
                            </div>
                            {request.description && (
                                <div>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Description</p>
                                    <p className="text-sm text-gray-600 mt-0.5 max-h-24 overflow-y-auto">{request.description}</p>
                                </div>
                            )}
                            {request.reference_image && (
                                <div>
                                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Reference Image</p>
                                    <img
                                        src={STORAGE_URL + request.reference_image}
                                        alt="Reference"
                                        className="max-w-xs max-h-40 rounded-lg border border-gray-200 object-contain"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Admin Action */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Action</h4>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Status</label>
                                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Admin Notes</label>
                                <textarea
                                    value={form.admin_notes}
                                    onChange={e => set('admin_notes', e.target.value)}
                                    className={inputCls + ' resize-none'}
                                    rows={3}
                                    placeholder="Add notes about this request..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Upload Delivered Frame</label>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${dragOver ? 'border-rose-400 bg-rose-50/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
                                    onClick={() => document.getElementById('delivered-file-input').click()}
                                >
                                    {filePreview ? (
                                        <div className="space-y-2">
                                            <img src={filePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg" />
                                            <p className="text-xs text-gray-500">{file?.name}</p>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setFilePreview(null); }}
                                                className="text-xs text-red-500 hover:text-red-600 font-medium">Remove</button>
                                        </div>
                                    ) : request.delivered_file ? (
                                        <div className="space-y-2">
                                            <img src={STORAGE_URL + request.delivered_file} alt="Current delivered" className="max-h-32 mx-auto rounded-lg" />
                                            <p className="text-xs text-gray-400">Current file - click or drop to replace</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                            </svg>
                                            <p className="text-sm text-gray-500">Drop image here or click to browse</p>
                                            <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                                        </div>
                                    )}
                                    <input
                                        id="delivered-file-input"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => handleFileChange(e.target.files[0])}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1.5">Link Existing Frame Layer <span className="text-gray-400 font-normal">(optional)</span></label>
                                <input
                                    type="number"
                                    value={form.frame_layer_id}
                                    onChange={e => set('frame_layer_id', e.target.value)}
                                    className={inputCls}
                                    placeholder="Enter frame layer ID..."
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
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
                Showing <span className="font-semibold text-gray-600">{from}</span> to <span className="font-semibold text-gray-600">{to}</span> of <span className="font-semibold text-gray-600">{total}</span> requests
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
export default function FrameRequests() {
    const dispatch = useDispatch();
    const { items: requests, loading, pagination } = useSelector((state) => state.frameRequests);
    const [processTarget, setProcessTarget] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);

    const loadRequests = useCallback((params = {}) => {
        dispatch(fetchFrameRequests({
            page: params.page || 1,
            search: params.search ?? search,
            status: params.status ?? statusFilter,
            per_page: 10,
        }));
    }, [dispatch, search, statusFilter]);

    useEffect(() => {
        loadRequests({ page: 1 });
    }, [statusFilter]);

    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => {
            loadRequests({ page: 1, search: value });
        }, 400));
    };

    const handlePageChange = (page) => {
        loadRequests({ page });
    };

    const handleProcess = async ({ id, formData }) => {
        const result = await dispatch(updateFrameRequest({ id, formData }));
        if (result.error) return alertError('Update Failed', result.payload);
        setProcessTarget(null);
        loadRequests({ page: pagination.current_page });
        alertSuccess('Request Updated');
    };

    const handleDelete = async (id) => {
        const confirmed = await alertConfirmDelete('this frame layer request');
        if (!confirmed) return;
        const result = await dispatch(deleteFrameRequest(id));
        if (result.error) return alertError('Delete Failed', result.payload);
        loadRequests({ page: pagination.current_page });
        alertSuccess('Request Deleted');
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Frame Layer Requests</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage customer frame layer customization requests</p>
                </div>
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
                            placeholder="Search by title or customer name..."
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3M2.25 18.75h19.5" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">{search || statusFilter ? 'No requests found' : 'No frame layer requests yet'}</h3>
                        <p className="text-xs text-gray-400 mt-1">{search || statusFilter ? 'Try adjusting your search or filter.' : 'Customer requests will appear here.'}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Customer</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Request Title</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Reference</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Delivered</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {requests.map((r) => (
                                <tr key={r.id} className="group hover:bg-gray-50/60 transition-colors">
                                    {/* Customer */}
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(r.customer?.id)} flex items-center justify-center shadow-sm`}>
                                                <span className="text-white text-xs font-bold">{getInitials(r.customer?.name)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{r.customer?.name || '—'}</p>
                                                <p className="text-[11px] text-gray-400 truncate">{r.customer?.email || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Request Title */}
                                    <td className="px-6 py-3.5">
                                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{r.title}</p>
                                        {r.description && (
                                            <p className="text-[11px] text-gray-400 truncate max-w-[200px] mt-0.5">{r.description}</p>
                                        )}
                                    </td>
                                    {/* Status */}
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${statusConfig[r.status]?.bg || 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                                            {statusConfig[r.status]?.label || r.status}
                                        </span>
                                    </td>
                                    {/* Reference */}
                                    <td className="px-6 py-3.5">
                                        {r.reference_image ? (
                                            <img src={STORAGE_URL + r.reference_image} alt="Reference" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                        ) : (
                                            <span className="text-sm text-gray-300">—</span>
                                        )}
                                    </td>
                                    {/* Delivered */}
                                    <td className="px-6 py-3.5">
                                        {r.delivered_file ? (
                                            <img src={STORAGE_URL + r.delivered_file} alt="Delivered" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                                        ) : (
                                            <span className="text-sm text-gray-300">—</span>
                                        )}
                                    </td>
                                    {/* Date */}
                                    <td className="px-6 py-3.5">
                                        <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-1 transition-opacity">
                                            {/* View/Process */}
                                            <button
                                                onClick={() => setProcessTarget(r)}
                                                className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                                                title="View / Process"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </button>
                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(r.id)}
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
                {!loading && requests.length > 0 && (
                    <Pagination pagination={pagination} onPageChange={handlePageChange} />
                )}
            </div>

            {/* Process Modal */}
            {processTarget && (
                <ProcessModal
                    request={processTarget}
                    onClose={() => setProcessTarget(null)}
                    onSave={handleProcess}
                />
            )}
        </div>
    );
}
