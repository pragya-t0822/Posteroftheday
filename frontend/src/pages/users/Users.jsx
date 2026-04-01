import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../features/users/userSlice';
import { fetchRoles } from '../../features/roles/roleSlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';

const roleColors = {
    super_admin: 'bg-rose-50 text-rose-600 ring-rose-500/10',
    admin: 'bg-indigo-50 text-indigo-600 ring-indigo-500/10',
    staff: 'bg-emerald-50 text-emerald-600 ring-emerald-500/10',
    customer: 'bg-gray-100 text-gray-600 ring-gray-500/10',
};

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

/* ──────────── User Modal ──────────── */
function UserModal({ user, roles, onClose, onSave }) {
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        role_id: user?.role_id || '',
    });
    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...form };
        if (!data.password) delete data.password;
        onSave(user ? { id: user.id, ...data } : data);
    };

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{user ? 'Edit User' : 'New User'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{user ? 'Update account details' : 'Create a new user account'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Avatar preview */}
                    {user && (
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(user.id)} flex items-center justify-center`}>
                                <span className="text-white text-sm font-bold">{getInitials(user.name)}</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
                            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="John Doe" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Role</label>
                            <select value={form.role_id} onChange={e => set('role_id', e.target.value)} className={inputCls} required>
                                <option value="">Select role</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Email Address</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="john@example.com" required />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">
                            Password {user && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                        </label>
                        <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className={inputCls} placeholder={user ? '••••••••' : 'Min 8 characters'}
                            {...(!user && { required: true, minLength: 8 })} />
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all">
                            {user ? 'Update User' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────── Delete Modal ──────────── */
function DeleteModal({ user, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center">Delete User</h3>
                <p className="text-sm text-gray-500 text-center mt-2">
                    Are you sure you want to delete <span className="font-semibold text-gray-700">{user.name}</span>? This action cannot be undone.
                </p>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={() => { onConfirm(user.id); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function Users() {
    const dispatch = useDispatch();
    const { items: users, loading } = useSelector((state) => state.users);
    const { items: roles } = useSelector((state) => state.roles);
    const [modal, setModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        dispatch(fetchUsers());
        dispatch(fetchRoles());
    }, [dispatch]);

    const handleSave = async (data) => {
        const isEdit = !!data.id;
        const result = isEdit ? await dispatch(updateUser(data)) : await dispatch(createUser(data));
        if (result.error) return alertError(isEdit ? 'Update Failed' : 'Create Failed', result.payload);
        setModal(null);
        dispatch(fetchUsers());
        alertSuccess(isEdit ? 'User Updated' : 'User Created');
    };

    const handleDelete = async (id) => {
        const confirmed = await alertConfirmDelete('this user');
        if (!confirmed) return;
        const result = await dispatch(deleteUser(id));
        if (result.error) return alertError('Delete Failed', result.payload);
        dispatch(fetchUsers());
        alertSuccess('User Deleted');
    };

    const filtered = users.filter(u => {
        const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role?.slug === roleFilter;
        return matchSearch && matchRole;
    });

    const roleCounts = users.reduce((acc, u) => {
        const slug = u.role?.slug || 'none';
        acc[slug] = (acc[slug] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h2>
                    <p className="text-sm text-gray-400 mt-1">{users.length} total accounts</p>
                </div>
                <button
                    onClick={() => setModal('new')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98]"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                    Add User
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                            <p className="text-xs text-gray-400">Total Users</p>
                        </div>
                    </div>
                </div>
                {['super_admin', 'admin', 'staff', 'customer'].map(slug => (
                    <div key={slug} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                slug === 'super_admin' ? 'bg-gradient-to-br from-rose-500 to-rose-600' :
                                slug === 'admin' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' :
                                slug === 'staff' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                                'bg-gradient-to-br from-gray-400 to-gray-500'
                            }`}>
                                <span className="text-white text-sm font-bold">{roleCounts[slug] || 0}</span>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900 capitalize">{slug.replace('_', ' ')}</p>
                                <p className="text-xs text-gray-400">accounts</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search + Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                            placeholder="Search by name or email..."
                        />
                    </div>
                    {/* Role filter pills */}
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setRoleFilter('all')}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${roleFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                            All
                        </button>
                        {roles.map(r => (
                            <button key={r.slug} onClick={() => setRoleFilter(r.slug)}
                                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all capitalize ${roleFilter === r.slug ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                {r.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900">{search || roleFilter !== 'all' ? 'No users found' : 'No users yet'}</h3>
                        <p className="text-xs text-gray-400 mt-1">{search || roleFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Create your first user to get started.'}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">User</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Role</th>
                                <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Joined</th>
                                <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((u) => (
                                <tr key={u.id} className="group hover:bg-gray-50/60 transition-colors">
                                    {/* User */}
                                    <td className="px-6 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(u.id)} flex items-center justify-center shadow-sm`}>
                                                <span className="text-white text-xs font-bold">{getInitials(u.name)}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                                                <p className="text-xs text-gray-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {/* Role */}
                                    <td className="px-6 py-3.5">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-bold ring-1 ${roleColors[u.role?.slug] || 'bg-gray-100 text-gray-600 ring-gray-200'}`}>
                                            {u.role?.name || 'No role'}
                                        </span>
                                    </td>
                                    {/* Joined */}
                                    <td className="px-6 py-3.5">
                                        <span className="text-xs text-gray-400">
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                        </span>
                                    </td>
                                    {/* Actions */}
                                    <td className="px-6 py-3.5 text-right">
                                        <div className="inline-flex items-center gap-1 transition-opacity">
                                            <button
                                                onClick={() => setModal(u)}
                                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(u)}
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

                {/* Table footer */}
                {!loading && filtered.length > 0 && (
                    <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{users.length}</span> users
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {modal && (
                <UserModal
                    user={modal === 'new' ? null : modal}
                    roles={roles}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}
            {deleteTarget && (
                <DeleteModal
                    user={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}
