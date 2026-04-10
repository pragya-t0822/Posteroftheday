import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchReminders, deleteReminder, toggleReminder } from '../../features/reminders/reminderSlice';
import { fetchCategoriesFlat } from '../../features/categories/categorySlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';
import AdvancedFilters from '../../components/AdvancedFilters';
import Pagination from '../../components/Pagination';

/* ──────────── Helper: normalize & format date ──────────── */
function toDateOnly(dateStr) {
    if (!dateStr) return '';
    return dateStr.slice(0, 10); // extract YYYY-MM-DD from any format
}

function formatDate(dateStr) {
    const iso = toDateOnly(dateStr);
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isToday(dateStr) {
    const iso = toDateOnly(dateStr);
    if (!iso) return false;
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
    return iso === todayStr;
}

function isPast(dateStr) {
    const iso = toDateOnly(dateStr);
    if (!iso) return false;
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
    return iso < todayStr;
}

/* ──────────── Helper: Selected Items Pills ──────────── */
function SelectedItemsPills({ categoryIds, categories }) {
    const MAX_SHOW = 3;
    const selectedCategories = (categories || []).filter(c => (categoryIds || []).includes(c.id));

    if (selectedCategories.length === 0) {
        return <span className="text-xs text-gray-400 italic">None selected</span>;
    }

    return (
        <div className="flex flex-wrap gap-1">
            {selectedCategories.slice(0, MAX_SHOW).map(c => (
                <span key={c.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                    {c.name}
                </span>
            ))}
            {selectedCategories.length > MAX_SHOW && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
                    +{selectedCategories.length - MAX_SHOW} more
                </span>
            )}
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function Reminders() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items: reminders, loading, pagination } = useSelector((state) => state.reminders);
    const { flat: categories } = useSelector((state) => state.categories);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const loadReminders = useCallback((params = {}) => {
        dispatch(fetchReminders({
            page: params.page || 1,
            search: params.search ?? search,
            status: params.status ?? statusFilter,
            date_from: params.date_from ?? dateFrom,
            date_to: params.date_to ?? dateTo,
            per_page: 10,
        }));
    }, [dispatch, search, statusFilter, dateFrom, dateTo]);

    useEffect(() => {
        loadReminders({ page: 1 });
        dispatch(fetchCategoriesFlat());
    }, []);

    useEffect(() => {
        loadReminders({ page: 1 });
    }, [statusFilter, dateFrom, dateTo]);

    const handleSearchChange = (value) => {
        setSearch(value);
        loadReminders({ page: 1, search: value });
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
        dispatch(fetchReminders({ page: 1, per_page: 10 }));
    };

    const handlePageChange = (page) => {
        loadReminders({ page });
    };

    const handleDelete = async (id) => {
        const confirmed = await alertConfirmDelete('this reminder');
        if (!confirmed) return;
        const result = await dispatch(deleteReminder(id));
        if (result.error) return alertError('Delete Failed', result.payload);
        loadReminders({ page: pagination.current_page });
        alertSuccess('Reminder Deleted');
    };

    const handleToggle = async (id) => {
        const result = await dispatch(toggleReminder(id));
        if (result.error) return alertError('Toggle Failed', result.payload);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reminders</h2>
                    <p className="text-sm text-gray-400 mt-1">Schedule and manage occasion-based reminders for priority content</p>
                </div>
                <button
                    onClick={() => navigate('/reminders/create')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98]"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Reminder
                </button>
            </div>

            {/* Advanced Filters */}
            <AdvancedFilters
                search={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search by title or occasion..."
                filters={[
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

            {/* Reminders Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : reminders.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">{search || statusFilter || dateFrom || dateTo ? 'No reminders found' : 'No reminders yet'}</h3>
                        <p className="text-xs text-gray-400 mt-1">{search || statusFilter || dateFrom || dateTo ? 'Try adjusting your search or filters.' : 'Create your first reminder to get started.'}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Title</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Date</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Selected Items</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {reminders.map((r) => (
                                <tr key={r.id} className="group hover:bg-gray-50/60 transition-colors">
                                    {/* Title */}
                                    <td className="px-6 py-3.5">
                                        <div>
                                            <span className="text-sm font-semibold text-gray-900">{r.title}</span>
                                            {r.occasion && (
                                                <p className="text-xs text-gray-400 italic mt-0.5">{r.occasion}</p>
                                            )}
                                        </div>
                                    </td>
                                    {/* Date */}
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm ${isPast(r.reminder_date) ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {formatDate(r.reminder_date)}
                                            </span>
                                            {isToday(r.reminder_date) && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-500 ring-1 ring-rose-500/10">
                                                    Today
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    {/* Selected Items */}
                                    <td className="px-6 py-3.5">
                                        <SelectedItemsPills
                                            categoryIds={r.category_ids}
                                            categories={categories}
                                        />
                                    </td>
                                    {/* Status Toggle */}
                                    <td className="px-6 py-3.5">
                                        <button
                                            onClick={() => handleToggle(r.id)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${r.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                            title={r.is_active ? 'Active - click to deactivate' : 'Inactive - click to activate'}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${r.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            {/* Edit */}
                                            <button
                                                onClick={() => navigate(`/reminders/${r.id}/edit`)}
                                                className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                                                </svg>
                                            </button>
                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(r.id)}
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
                {!loading && reminders.length > 0 && (
                    <Pagination pagination={pagination} onPageChange={handlePageChange} itemLabel="reminders" />
                )}
            </div>

        </div>
    );
}
