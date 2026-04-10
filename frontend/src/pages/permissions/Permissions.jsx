import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPermissions, createPermission, updatePermission, deletePermission } from '../../features/permissions/permissionSlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';
import AdvancedFilters from '../../components/AdvancedFilters';

const moduleColors = {
    users: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-500/10', icon: 'from-blue-500 to-blue-600' },
    roles: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-500/10', icon: 'from-violet-500 to-violet-600' },
    permissions: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-500/10', icon: 'from-amber-500 to-amber-600' },
    subscriptions: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-500/10', icon: 'from-emerald-500 to-emerald-600' },
    posters: { bg: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-500/10', icon: 'from-rose-500 to-rose-600' },
    navigation: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'ring-cyan-500/10', icon: 'from-cyan-500 to-cyan-600' },
};

const moduleIcons = {
    users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    roles: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    permissions: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z',
    subscriptions: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z',
    posters: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z',
    navigation: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
};

function getModuleStyle(module) {
    const key = module?.toLowerCase() || '';
    return moduleColors[key] || { bg: 'bg-gray-50', text: 'text-gray-600', ring: 'ring-gray-500/10', icon: 'from-gray-500 to-gray-600' };
}

function getModuleIcon(module) {
    const key = module?.toLowerCase() || '';
    return moduleIcons[key] || 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z';
}

/* ──────────── Permission Modal ──────────── */
function PermModal({ permission, modules, onClose, onSave }) {
    const [form, setForm] = useState({
        name: permission?.name || '',
        slug: permission?.slug || '',
        module: permission?.module || '',
        description: permission?.description || '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };
    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Permission name is required';
        if (!form.slug.trim()) errs.slug = 'Slug is required';
        else if (!/^[a-z][a-z0-9._]*$/.test(form.slug)) errs.slug = 'Slug must be lowercase with dots/underscores only';
        if (!form.module.trim()) errs.module = 'Module is required';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        await onSave(permission ? { id: permission.id, ...form } : form);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{permission ? 'Edit Permission' : 'New Permission'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{permission ? 'Update permission details' : 'Define a new permission rule'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Permission Name</label>
                            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={`${inputCls} ${errors.name ? 'border-red-400 ring-2 ring-red-400/10' : ''}`} placeholder="View Users" />
                            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Slug</label>
                            <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)} className={`${inputCls} ${errors.slug ? 'border-red-400 ring-2 ring-red-400/10' : ''}`} placeholder="users.view" />
                            {errors.slug && <p className="text-[11px] text-red-500 mt-1">{errors.slug}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Module</label>
                        <input type="text" value={form.module} onChange={e => set('module', e.target.value)} className={`${inputCls} ${errors.module ? 'border-red-400 ring-2 ring-red-400/10' : ''}`} placeholder="users" list="module-list" />
                        <datalist id="module-list">
                            {modules.map(m => <option key={m} value={m} />)}
                        </datalist>
                        {errors.module && <p className="text-[11px] text-red-500 mt-1">{errors.module}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} rows={2} placeholder="What does this permission allow?" />
                    </div>
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">{saving ? 'Saving...' : permission ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function Permissions() {
    const dispatch = useDispatch();
    const { items: permissions, loading } = useSelector((state) => state.permissions);
    const [modal, setModal] = useState(null);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    useEffect(() => { dispatch(fetchPermissions()); }, [dispatch]);

    const grouped = permissions.reduce((acc, p) => {
        if (p.module?.toLowerCase() === 'customers') return acc;
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
    }, {});

    const modules = Object.keys(grouped);

    const filteredGrouped = (() => {
        let result = grouped;
        if (search) {
            result = Object.entries(result).reduce((acc, [mod, perms]) => {
                const filtered = perms.filter(p =>
                    p.name.toLowerCase().includes(search.toLowerCase()) ||
                    p.slug.toLowerCase().includes(search.toLowerCase()) ||
                    mod.toLowerCase().includes(search.toLowerCase())
                );
                if (filtered.length > 0) acc[mod] = filtered;
                return acc;
            }, {});
        }
        if (dateFrom || dateTo) {
            result = Object.entries(result).reduce((acc, [mod, perms]) => {
                const filtered = perms.filter(p => {
                    const matchDateFrom = !dateFrom || (p.created_at && new Date(p.created_at) >= new Date(dateFrom));
                    const matchDateTo = !dateTo || (p.created_at && new Date(p.created_at) <= new Date(dateTo + 'T23:59:59'));
                    return matchDateFrom && matchDateTo;
                });
                if (filtered.length > 0) acc[mod] = filtered;
                return acc;
            }, {});
        }
        return result;
    })();

    const handleSearchChange = (value) => {
        setSearch(value);
    };

    const handleDateChange = (key, value) => {
        if (key === 'date_from') setDateFrom(value);
        if (key === 'date_to') setDateTo(value);
    };

    const handleReset = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
    };

    const handleSave = async (data) => {
        const isEdit = !!data.id;
        const result = isEdit ? await dispatch(updatePermission(data)) : await dispatch(createPermission(data));
        if (result.error) return alertError(isEdit ? 'Update Failed' : 'Create Failed', result.payload);
        setModal(null);
        dispatch(fetchPermissions());
        alertSuccess(isEdit ? 'Permission Updated' : 'Permission Created');
    };

    const handleDelete = async (id) => {
        const confirmed = await alertConfirmDelete('this permission');
        if (!confirmed) return;
        const result = await dispatch(deletePermission(id));
        if (result.error) return alertError('Delete Failed', result.payload);
        dispatch(fetchPermissions());
        alertSuccess('Permission Deleted');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Permissions</h2>
                    <p className="text-sm text-gray-400 mt-1">{permissions.length} permissions across {modules.length} modules</p>
                </div>
                <button onClick={() => setModal('new')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add Permission
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{permissions.length}</p>
                            <p className="text-xs text-gray-400">Total Permissions</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" /></svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
                            <p className="text-xs text-gray-400">Modules</p>
                        </div>
                    </div>
                </div>
                {modules.slice(0, 2).map(mod => {
                    const style = getModuleStyle(mod);
                    return (
                        <div key={mod} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.icon} flex items-center justify-center`}>
                                    <span className="text-white text-sm font-bold">{grouped[mod].length}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 capitalize">{mod}</p>
                                    <p className="text-xs text-gray-400">permissions</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Advanced Filters */}
            <AdvancedFilters
                search={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search permissions by name, slug, or module..."
                filters={[]}
                onFilterChange={() => {}}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={handleDateChange}
                onReset={handleReset}
            />

            {/* Permission Groups */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </div>
            ) : Object.keys(filteredGrouped).length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">{search ? 'No permissions found' : 'No permissions yet'}</h3>
                    <p className="text-xs text-gray-400 mt-1">{search ? 'Try a different search term.' : 'Create your first permission to get started.'}</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {Object.entries(filteredGrouped).map(([module, perms]) => {
                        const style = getModuleStyle(module);
                        const iconPath = getModuleIcon(module);
                        return (
                            <div key={module} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Module Header */}
                                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${style.icon} flex items-center justify-center`}>
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-gray-900 capitalize">{module}</h3>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${style.bg} ${style.text} ${style.ring}`}>
                                        {perms.length} permissions
                                    </span>
                                </div>

                                {/* Permission rows */}
                                <div className="divide-y divide-gray-50">
                                    {perms.map((p) => (
                                        <div key={p.id} className="group flex items-center gap-4 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                                            {/* Icon */}
                                            <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                                                <svg className={`w-4 h-4 ${style.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                                                </svg>
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                                                <p className="text-[11px] font-mono text-gray-400 mt-0.5">{p.slug}</p>
                                            </div>
                                            {/* Description */}
                                            {p.description && (
                                                <p className="text-xs text-gray-400 max-w-[200px] truncate hidden lg:block">{p.description}</p>
                                            )}
                                            {/* Actions */}
                                            <div className="inline-flex items-center gap-1 transition-opacity">
                                                <button onClick={() => setModal(p)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-700 transition-colors" title="Edit">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors" title="Delete">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {modal && <PermModal permission={modal === 'new' ? null : modal} modules={modules} onClose={() => setModal(null)} onSave={handleSave} />}

        </div>
    );
}
