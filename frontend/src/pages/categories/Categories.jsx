import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';
import {
    fetchCategories,
    fetchCategoriesFlat,
    createCategory,
    updateCategory,
    deleteCategory,
    clearCategoryError,
} from '../../features/categories/categorySlice';

/* ──────────── helpers ──────────── */
function countAll(node) {
    let c = 1;
    if (node.recursive_children) node.recursive_children.forEach(ch => (c += countAll(ch)));
    return c;
}
function flatTotal(tree) {
    return tree.reduce((s, n) => s + countAll(n), 0);
}
function depthLabel(flat, id) {
    const parts = [];
    let cur = flat.find(c => c.id === id);
    while (cur) {
        parts.unshift(cur.name);
        cur = cur.parent_id ? flat.find(c => c.id === cur.parent_id) : null;
    }
    return parts.join(' \u2192 ');
}

/* ──────────── Searchable Select ──────────── */
function SearchableSelect({ value, onChange, options, placeholder = 'Select...', allowClear = false }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef(null);
    const inputRef = useRef(null);

    const selected = options.find(o => String(o.id) === String(value));

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (open && inputRef.current) inputRef.current.focus();
    }, [open]);

    const filtered = query
        ? options.filter(o => o.name.toLowerCase().includes(query.toLowerCase()))
        : options;

    const handleSelect = (id) => {
        onChange(id);
        setOpen(false);
        setQuery('');
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => { setOpen(!open); setQuery(''); }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-left outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
            >
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <span className={`flex-1 truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
                    {selected ? selected.name : placeholder}
                </span>
                {allowClear && selected ? (
                    <span onClick={(e) => { e.stopPropagation(); handleSelect(''); }} className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </span>
                ) : (
                    <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                )}
            </button>
            {open && (
                <div className="absolute z-40 mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-1 focus:ring-rose-500/20 transition-all" />
                        </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-400 text-center">No results found</p>
                        ) : filtered.map(o => (
                            <button key={o.id} type="button" onClick={() => handleSelect(o.id)}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${String(o.id) === String(value) ? 'bg-rose-50 text-rose-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <span>{o.label}</span>
                                {String(o.id) === String(value) && (
                                    <svg className="w-4 h-4 text-rose-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ──────────── Category Modal ──────────── */
function CategoryModal({ category, flatList, onClose, onSave }) {
    const [form, setForm] = useState({
        name: category?.name || '',
        slug: category?.slug || '',
        description: category?.description || '',
        parent_id: category?.parent_id || '',
        sort_order: category?.sort_order ?? 0,
        is_active: category?.is_active ?? true,
    });
    const [translations, setTranslations] = useState(
        category?.translations?.length
            ? category.translations.map(t => ({ language: t.language, name: t.name, custom: false }))
            : []
    );

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const handleNameChange = (val) => { set('name', val); if (!category) set('slug', autoSlug(val)); };

    const parentOptions = flatList
        .filter(c => !category || c.id !== category.id)
        .map(c => ({ id: c.id, name: c.name, label: depthLabel(flatList, c.id) }));

    // Default languages + any additional from existing translations
    const defaultLanguages = ['Hindi', 'English', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Punjabi', 'Urdu'];
    const knownLanguages = [...new Set([
        ...defaultLanguages,
        ...flatList.flatMap(c => (c.translations || []).map(t => t.language))
    ])].sort();

    // Translation handlers
    const addTranslation = () => setTranslations(t => [...t, { language: '', name: '', custom: false }]);
    const updateTranslation = (idx, key, val) => setTranslations(t => t.map((item, i) => i === idx ? { ...item, [key]: val } : item));
    const removeTranslation = (idx) => setTranslations(t => t.filter((_, i) => i !== idx));

    const handleSubmit = (e) => {
        e.preventDefault();
        const validTranslations = translations
            .filter(t => t.language.trim() && t.name.trim())
            .map(({ language, name }) => ({ language, name }));
        const payload = {
            ...form,
            parent_id: form.parent_id || null,
            sort_order: Number(form.sort_order),
            translations: validTranslations,
        };
        onSave(category ? { id: category.id, ...payload } : payload);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{category ? 'Edit Category' : 'New Category'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{category ? 'Update category details' : 'Create a new category or sub-category'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Name</label>
                            <input type="text" value={form.name} onChange={e => handleNameChange(e.target.value)} className={inputCls} placeholder="Festival" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Slug</label>
                            <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} placeholder="festival" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Parent Category</label>
                        <SearchableSelect
                            value={form.parent_id}
                            onChange={(id) => set('parent_id', id)}
                            options={parentOptions}
                            placeholder="None (Root Level)"
                            allowClear
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} rows={2} placeholder="Optional description..." />
                    </div>

                    {/* Translations */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-500">Translations</label>
                            <button type="button" onClick={addTranslation}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                Add Language
                            </button>
                        </div>
                        {translations.length === 0 ? (
                            <div className="border border-dashed border-gray-200 rounded-xl px-4 py-3 text-center">
                                <p className="text-xs text-gray-400">No translations added yet.</p>
                                <button type="button" onClick={addTranslation}
                                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 mt-1 transition-colors">
                                    + Add New Language
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {translations.map((t, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        {t.custom ? (
                                            <div className="flex items-center gap-1 w-[140px]">
                                                <input
                                                    type="text"
                                                    value={t.language}
                                                    onChange={e => updateTranslation(idx, 'language', e.target.value)}
                                                    className="flex-1 px-2.5 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                                                    placeholder="Language"
                                                    autoFocus
                                                />
                                                <button type="button" onClick={() => { updateTranslation(idx, 'custom', false); updateTranslation(idx, 'language', ''); }}
                                                    className="text-gray-400 hover:text-gray-600 shrink-0" title="Back to list">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <select
                                                value={t.language}
                                                onChange={e => {
                                                    if (e.target.value === '__custom__') {
                                                        updateTranslation(idx, 'custom', true);
                                                        updateTranslation(idx, 'language', '');
                                                    } else {
                                                        updateTranslation(idx, 'language', e.target.value);
                                                    }
                                                }}
                                                className="w-[140px] px-2.5 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                                            >
                                                <option value="">Select Language</option>
                                                {knownLanguages.map(lang => (
                                                    <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                                                ))}
                                                <option value="__custom__">+ Add New...</option>
                                            </select>
                                        )}
                                        <input
                                            type="text"
                                            value={t.name}
                                            onChange={e => updateTranslation(idx, 'name', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                                            placeholder="Translated name"
                                        />
                                        <button type="button" onClick={() => removeTranslation(idx)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Sort Order</label>
                            <input type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} className={inputCls} />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500" />
                                <span className="text-sm text-gray-700 font-medium">Active</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all">{category ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────── Delete Modal ──────────── */
function DeleteModal({ category, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center">Delete Category</h3>
                <p className="text-sm text-gray-500 text-center mt-2">Are you sure you want to delete <span className="font-semibold text-gray-700">{category.name}</span>? This action cannot be undone.</p>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={() => { onConfirm(category.id); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">Delete</button>
                </div>
            </div>
        </div>
    );
}

/* ──────────── Tree Node ──────────── */
function TreeNode({ node, depth, onEdit, onDelete, onAddChild, search }) {
    const [expanded, setExpanded] = useState(true);
    const children = node.recursive_children || [];
    const hasChildren = children.length > 0;
    const translations = node.translations || [];

    const matchesSearch = search && node.name.toLowerCase().includes(search.toLowerCase());

    return (
        <div>
            <div
                className={`group flex items-center gap-2 py-2 px-3 rounded-xl transition-all duration-150 hover:bg-gray-50 ${matchesSearch ? 'bg-amber-50 ring-1 ring-amber-200' : ''}`}
                style={{ paddingLeft: `${depth * 24 + 12}px` }}
            >
                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`w-5 h-5 flex items-center justify-center rounded transition-colors shrink-0 ${hasChildren ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-200' : 'text-transparent'}`}
                    disabled={!hasChildren}
                >
                    <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                </button>

                {/* Folder / leaf icon */}
                {hasChildren ? (
                    <svg className="w-4.5 h-4.5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                ) : (
                    <svg className="w-4.5 h-4.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.875 14.25l1.214 1.942a2.25 2.25 0 001.908 1.058h2.006c.776 0 1.497-.4 1.908-1.058l1.214-1.942M2.41 9h4.636a2.25 2.25 0 011.872 1.002l.164.246a2.25 2.25 0 001.872 1.002h2.092a2.25 2.25 0 001.872-1.002l.164-.246A2.25 2.25 0 0116.954 9h4.636M12 3v2.25m0 0a2.25 2.25 0 002.25 2.25H21M12 5.25a2.25 2.25 0 01-2.25 2.25H3" />
                    </svg>
                )}

                {/* Name, slug & translations */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{node.name}</span>
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded hidden sm:inline">{node.slug}</span>
                        {!node.is_active && (
                            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded ring-1 ring-orange-200">Inactive</span>
                        )}
                        {hasChildren && (
                            <span className="text-[10px] font-medium text-gray-400">{children.length}</span>
                        )}
                    </div>
                    {translations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {translations.map(t => (
                                <span key={t.id || t.language} className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded ring-1 ring-gray-200">
                                    <span className="font-semibold text-gray-600">{t.language}:</span> {t.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions — visible on hover */}
                <div className="flex items-center gap-1 transition-opacity shrink-0">
                    <button onClick={() => onAddChild(node)} title="Add sub-category"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    </button>
                    <button onClick={() => onEdit(node)} title="Edit"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                    </button>
                    <button onClick={() => onDelete(node)} title="Delete"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                </div>
            </div>

            {/* Children */}
            {expanded && hasChildren && (
                <div>
                    {children.map(child => (
                        <TreeNode key={child.id} node={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} search={search} />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function Categories() {
    const dispatch = useDispatch();
    const { tree, flat, loading, error } = useSelector((state) => state.categories);
    const [modal, setModal] = useState(null);
    const [parentHint, setParentHint] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchCategoriesFlat());
    }, [dispatch]);

    const reload = () => {
        dispatch(fetchCategories());
        dispatch(fetchCategoriesFlat());
    };

    const handleSave = async (data) => {
        const isEdit = !!data.id;
        const result = isEdit ? await dispatch(updateCategory(data)) : await dispatch(createCategory(data));
        if (result.error) return alertError(isEdit ? 'Update Failed' : 'Create Failed', result.payload);
        setModal(null);
        setParentHint(null);
        reload();
        alertSuccess(isEdit ? 'Category Updated' : 'Category Created');
    };

    const handleDelete = async (id) => {
        const confirmed = await alertConfirmDelete('this category');
        if (!confirmed) return;
        const result = await dispatch(deleteCategory(id));
        if (result.error) return alertError('Delete Failed', result.payload);
        reload();
        alertSuccess('Category Deleted');
    };

    const handleAddChild = (parentNode) => {
        setParentHint(parentNode.id);
        setModal('new');
    };

    const total = flatTotal(tree);
    const rootCount = tree.length;
    const activeCount = flat.filter(c => c.is_active).length;

    const modalCategory = modal && modal !== 'new' ? modal : null;
    const modalDefaults = modalCategory || (parentHint ? { parent_id: parentHint } : null);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Categories</h2>
                    <p className="text-sm text-gray-400 mt-1">{total} categories &middot; {rootCount} root &middot; {activeCount} active</p>
                </div>
                <button onClick={() => { setParentHint(null); setModal('new'); }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add Category
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm text-red-700 flex-1">{error}</p>
                    <button onClick={() => dispatch(clearCategoryError())} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all" />
            </div>

            {/* Tree */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </div>
            ) : tree.length === 0 ? (
                <div className="text-center py-20">
                    <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">No categories yet</h3>
                    <p className="text-sm text-gray-400 mt-1">Create your first category to get started.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category Tree</span>
                    </div>
                    <div className="py-1">
                        {tree.map(node => (
                            <TreeNode key={node.id} node={node} depth={0}
                                onEdit={(cat) => { setParentHint(null); setModal(cat); }}
                                onDelete={setDeleteTarget} onAddChild={handleAddChild} search={search} />
                        ))}
                    </div>
                </div>
            )}

            {/* Modals */}
            {modal && (
                <CategoryModal category={modalDefaults} flatList={flat}
                    onClose={() => { setModal(null); setParentHint(null); }} onSave={handleSave} />
            )}
            {deleteTarget && (
                <DeleteModal category={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
            )}
        </div>
    );
}
