import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoles, createRole, updateRole, deleteRole, assignPermissions } from '../../features/roles/roleSlice';
import { fetchPermissions } from '../../features/permissions/permissionSlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';
import AdvancedFilters from '../../components/AdvancedFilters';

const roleIcons = {
    super_admin: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
    admin: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z',
    staff: 'M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0',
    customer: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z',
};
const roleGradients = {
    super_admin: 'from-rose-500 to-pink-600',
    admin: 'from-indigo-500 to-violet-600',
    staff: 'from-emerald-500 to-teal-600',
    customer: 'from-gray-500 to-gray-600',
};
const roleBadge = {
    super_admin: 'bg-rose-50 text-rose-600 ring-rose-500/10',
    admin: 'bg-indigo-50 text-indigo-600 ring-indigo-500/10',
    staff: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10',
    customer: 'bg-gray-100 text-gray-600 ring-gray-500/10',
};

/* ──────────── Role Modal ──────────── */
function RoleModal({ role, onClose, onSave }) {
    const [form, setForm] = useState({
        name: role?.name || '',
        slug: role?.slug || '',
        description: role?.description || '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };
    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Role name is required';
        if (!form.slug.trim()) errs.slug = 'Slug is required';
        else if (!/^[a-z][a-z0-9_-]*$/.test(form.slug)) errs.slug = 'Slug must be lowercase with hyphens/underscores only';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSaving(true);
        await onSave(role ? { id: role.id, ...form } : form);
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{role ? 'Edit Role' : 'New Role'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{role ? 'Update role details' : 'Define a new access role'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Role Name</label>
                            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={`${inputCls} ${errors.name ? 'border-red-400 ring-2 ring-red-400/10' : ''}`} placeholder="Admin" />
                            {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Slug</label>
                            <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)} className={`${inputCls} ${errors.slug ? 'border-red-400 ring-2 ring-red-400/10' : ''}`} placeholder="admin" />
                            {errors.slug && <p className="text-[11px] text-red-500 mt-1">{errors.slug}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} rows={2} placeholder="What can this role do?" />
                    </div>
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">{saving ? 'Saving...' : role ? 'Update Role' : 'Create Role'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────── Permission Assignment Modal ──────────── */
function PermissionModal({ role, allPermissions, onClose, onSave }) {
    const currentIds = role.permissions?.map(p => p.id) || [];
    const [selected, setSelected] = useState(currentIds);
    const [saving, setSaving] = useState(false);

    const grouped = allPermissions.reduce((acc, p) => {
        if (p.module?.toLowerCase() === 'customers') return acc;
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
    }, {});

    const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const toggleModule = (perms) => {
        const ids = perms.map(p => p.id);
        const allSelected = ids.every(id => selected.includes(id));
        setSelected(prev => allSelected ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleGradients[role.slug] || 'from-gray-500 to-gray-600'} flex items-center justify-center`}>
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={roleIcons[role.slug] || roleIcons.customer} />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{role.name}</h3>
                            <p className="text-xs text-gray-400">{selected.length} of {allPermissions.length} permissions selected</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Permission groups */}
                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                    {Object.entries(grouped).map(([module, perms]) => {
                        const moduleIds = perms.map(p => p.id);
                        const allChecked = moduleIds.every(id => selected.includes(id));
                        const someChecked = moduleIds.some(id => selected.includes(id));
                        return (
                            <div key={module} className="border border-gray-100 rounded-xl overflow-hidden">
                                {/* Module header */}
                                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/70 border-b border-gray-100">
                                    <label className="flex items-center gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                                            onChange={() => toggleModule(perms)}
                                            className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500"
                                        />
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{module}</span>
                                    </label>
                                    <span className="text-[10px] text-gray-400 font-medium">{moduleIds.filter(id => selected.includes(id)).length}/{perms.length}</span>
                                </div>
                                {/* Permissions */}
                                <div className="divide-y divide-gray-50">
                                    {perms.map(p => (
                                        <label key={p.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/50 cursor-pointer transition-colors">
                                            <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900">{p.name}</p>
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{p.slug}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-white">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button disabled={saving} onClick={async () => { setSaving(true); await onSave(selected); setSaving(false); }} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Permissions'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function Roles() {
    const dispatch = useDispatch();
    const { items: roles, loading } = useSelector((state) => state.roles);
    const { items: allPermissions } = useSelector((state) => state.permissions);
    const [modal, setModal] = useState(null);
    const [permModal, setPermModal] = useState(null);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    useEffect(() => {
        dispatch(fetchRoles());
        dispatch(fetchPermissions());
    }, [dispatch]);

    // Client-side filtering
    const filtered = roles.filter(r => {
        const matchSearch = !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.slug?.toLowerCase().includes(search.toLowerCase());
        const matchDateFrom = !dateFrom || (r.created_at && new Date(r.created_at) >= new Date(dateFrom));
        const matchDateTo = !dateTo || (r.created_at && new Date(r.created_at) <= new Date(dateTo + 'T23:59:59'));
        return matchSearch && matchDateFrom && matchDateTo;
    });

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
        const result = isEdit ? await dispatch(updateRole(data)) : await dispatch(createRole(data));
        if (result.error) return alertError(isEdit ? 'Update Failed' : 'Create Failed', result.payload);
        setModal(null);
        dispatch(fetchRoles());
        alertSuccess(isEdit ? 'Role Updated' : 'Role Created');
    };

    const handleDelete = async (id) => {
        const confirmed = await alertConfirmDelete('this role');
        if (!confirmed) return;
        const result = await dispatch(deleteRole(id));
        if (result.error) return alertError('Delete Failed', result.payload);
        dispatch(fetchRoles());
        alertSuccess('Role Deleted');
    };

    const handlePermSave = async (permissionIds) => {
        const result = await dispatch(assignPermissions({ roleId: permModal.id, permissions: permissionIds }));
        if (result.error) return alertError('Update Failed', result.payload);
        setPermModal(null);
        dispatch(fetchRoles());
        alertSuccess('Permissions Updated');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Roles & Access</h2>
                    <p className="text-sm text-gray-400 mt-1">{roles.length} roles configured &middot; {allPermissions.length} permissions available</p>
                </div>
                <button onClick={() => setModal('new')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add Role
                </button>
            </div>

            {/* Advanced Filters */}
            <AdvancedFilters
                search={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search roles by name or slug..."
                filters={[]}
                onFilterChange={() => {}}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={handleDateChange}
                onReset={handleReset}
            />

            {/* Role Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filtered.map((role) => {
                        const permCount = role.permissions?.length || 0;
                        const gradient = roleGradients[role.slug] || 'from-gray-500 to-gray-600';
                        const icon = roleIcons[role.slug] || roleIcons.customer;
                        const badge = roleBadge[role.slug] || 'bg-gray-100 text-gray-600 ring-gray-200';
                        return (
                            <div key={role.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
                                {/* Colored top bar */}
                                <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

                                <div className="p-5">
                                    {/* Header row */}
                                    <div className="flex items-start gap-3.5 mb-4">
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold text-gray-900">{role.name}</h3>
                                                {role.slug === 'super_admin' && (
                                                    <svg className="w-4 h-4 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7L2 9.4h7.6z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5">{role.slug}</p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 shrink-0 ${badge}`}>
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                                            {permCount}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    {role.description && (
                                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">{role.description}</p>
                                    )}

                                    {/* Permission tags */}
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {role.permissions?.slice(0, 6).map(p => (
                                            <span key={p.id} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500">
                                                {p.slug}
                                            </span>
                                        ))}
                                        {permCount > 6 && (
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-400">
                                                +{permCount - 6} more
                                            </span>
                                        )}
                                        {permCount === 0 && (
                                            <span className="text-xs text-gray-400 italic">No permissions assigned</span>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                                        <button onClick={() => setPermModal(role)}
                                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold hover:bg-rose-500 transition-all">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                                            Permissions
                                        </button>
                                        <button onClick={() => setModal(role)}
                                            className="py-2 px-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                                        </button>
                                        {role.slug !== 'super_admin' && (
                                            <button onClick={() => handleDelete(role.id)}
                                                className="py-2 px-3 rounded-xl border border-red-100 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {modal && <RoleModal role={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
            {permModal && <PermissionModal role={permModal} allPermissions={allPermissions} onClose={() => setPermModal(null)} onSave={handlePermSave} />}

        </div>
    );
}
