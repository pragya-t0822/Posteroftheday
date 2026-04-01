import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFrames, createFrame, updateFrame, deleteFrame, toggleFrame, clearFrameError } from '../../features/frames/frameSlice';
import { fetchCategories, fetchCategoriesFlat } from '../../features/categories/categorySlice';

const STORAGE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') + '/storage/';
/* ──────────── flatten tree into indented options ──────────── */
function flattenTree(nodes, depth = 0) {
    const result = [];
    for (const node of nodes) {
        const prefix = depth > 0 ? '│  '.repeat(depth - 1) + '├─ ' : '';
        result.push({ id: node.id, name: node.name, label: prefix + node.name, depth });
        if (node.recursive_children?.length) {
            result.push(...flattenTree(node.recursive_children, depth + 1));
        }
    }
    return result;
}

/* ──────────── get translated names ──────────── */
function getFrameTitle(frame, lang) {
    if (!lang) return frame.title;
    const t = (frame.translations || []).find(tr => tr.language.toLowerCase() === lang.toLowerCase());
    return t ? t.title : frame.title;
}

function getCategoryName(category, lang) {
    if (!category) return '—';
    if (!lang) return category.name;
    const t = (category.translations || []).find(tr => tr.language.toLowerCase() === lang.toLowerCase());
    return t ? t.name : category.name;
}

/* ──────────── Searchable Select Dropdown ──────────── */
function SearchableSelect({ value, onChange, options, placeholder = 'Select...', allowClear = false, searchPlaceholder = 'Search...', icon }) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef(null);
    const inputRef = useRef(null);

    const selected = options.find(o => String(o.id) === String(value));

    // Close on outside click
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
            {/* Trigger */}
            <button
                type="button"
                onClick={() => { setOpen(!open); setQuery(''); }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-left outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
            >
                {icon || (
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                )}
                <span className={`flex-1 truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
                    {selected ? selected.name : placeholder}
                </span>
                {allowClear && selected ? (
                    <span
                        onClick={(e) => { e.stopPropagation(); handleSelect(''); }}
                        className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </span>
                ) : (
                    <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-40 mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-1 focus:ring-rose-500/20 transition-all"
                            />
                        </div>
                    </div>
                    {/* Options */}
                    <div className="max-h-56 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-400 text-center">No categories found</p>
                        ) : (
                            filtered.map(o => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => handleSelect(o.id)}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${String(o.id) === String(value) ? 'bg-rose-50 text-rose-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <span className="font-mono text-gray-300 text-xs whitespace-pre">{o.label.slice(0, o.label.length - o.name.length)}</span>
                                    <span>{o.name}</span>
                                    {String(o.id) === String(value) && (
                                        <svg className="w-4 h-4 text-rose-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ──────────── Upload / Edit Modal ──────────── */
const DEFAULT_LANGUAGES = ['Hindi', 'English', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Bengali', 'Punjabi', 'Urdu'];

function FrameModal({ frame, categories, allCategories, onClose, onSave }) {
    const [form, setForm] = useState({
        title: frame?.title || '',
        slug: frame?.slug || '',
        category_id: frame?.category_id || '',
        is_active: frame?.is_active ?? true,
        sort_order: frame?.sort_order ?? 0,
    });
    const [translations, setTranslations] = useState(
        frame?.translations?.length
            ? frame.translations.map(t => ({ language: t.language, title: t.title, custom: false }))
            : []
    );
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(frame?.file_path ? STORAGE_URL + frame.file_path : null);
    const [submitting, setSubmitting] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    // Known languages from category translations + defaults
    const knownLanguages = [...new Set([
        ...DEFAULT_LANGUAGES,
        ...allCategories.flatMap(c => (c.translations || []).map(t => t.language))
    ])].sort();

    // Translation handlers
    const addTranslation = () => setTranslations(t => [...t, { language: '', title: '', custom: false }]);
    const updateTranslation = (idx, key, val) => setTranslations(t => t.map((item, i) => i === idx ? { ...item, [key]: val } : item));
    const removeTranslation = (idx) => setTranslations(t => t.filter((_, i) => i !== idx));

    const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const handleNameChange = (val) => { set('title', val); if (!frame) set('slug', autoSlug(val)); };

    const handleFile = (e) => {
        const f = e.target.files[0];
        if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('slug', form.slug);
        fd.append('category_id', form.category_id);
        fd.append('is_active', form.is_active ? '1' : '0');
        fd.append('sort_order', form.sort_order);
        const validTranslations = translations.filter(t => t.language.trim() && t.title.trim()).map(({ language, title }) => ({ language, title }));
        fd.append('translations', JSON.stringify(validTranslations));
        if (file) fd.append('frame', file);

        await onSave(frame ? { id: frame.id, formData: fd } : fd);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{frame ? 'Edit Frame' : 'Upload New Frame'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{frame ? 'Update frame details' : 'Upload an image frame to a category'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                    {/* File upload zone */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Frame Image {!frame && <span className="text-red-400">*</span>}</label>
                        <label className="block cursor-pointer">
                            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${preview ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200 hover:border-rose-300 hover:bg-gray-50'}`}>
                                {preview ? (
                                    <div className="relative inline-block">
                                        <img src={preview} alt="Preview" className="max-h-36 rounded-lg mx-auto shadow-sm" />
                                        <span className="block text-xs text-gray-400 mt-2">{file ? file.name : frame?.file_name}</span>
                                    </div>
                                ) : (
                                    <div className="py-4">
                                        <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                        </svg>
                                        <p className="text-sm text-gray-500">Click to upload frame image</p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WebP, SVG up to 5MB</p>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                            <input type="text" value={form.title} onChange={e => handleNameChange(e.target.value)} className={inputCls} placeholder="Festival Frame" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Slug</label>
                            <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} placeholder="festival-frame" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
                        <SearchableSelect
                            value={form.category_id}
                            onChange={(id) => set('category_id', id)}
                            options={categories}
                            placeholder="Select category"
                            searchPlaceholder="Search categories..."
                        />
                    </div>
                    {/* Title Translations */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-500">Title Translations</label>
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
                                                <input type="text" value={t.language}
                                                    onChange={e => updateTranslation(idx, 'language', e.target.value)}
                                                    className="flex-1 px-2.5 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                                                    placeholder="Language" autoFocus />
                                                <button type="button" onClick={() => { updateTranslation(idx, 'custom', false); updateTranslation(idx, 'language', ''); }}
                                                    className="text-gray-400 hover:text-gray-600 shrink-0" title="Back to list">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <select value={t.language}
                                                onChange={e => {
                                                    if (e.target.value === '__custom__') { updateTranslation(idx, 'custom', true); updateTranslation(idx, 'language', ''); }
                                                    else updateTranslation(idx, 'language', e.target.value);
                                                }}
                                                className="w-[140px] px-2.5 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all">
                                                <option value="">Select Language</option>
                                                {knownLanguages.map(lang => (
                                                    <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                                                ))}
                                                <option value="__custom__">+ Add New...</option>
                                            </select>
                                        )}
                                        <input type="text" value={t.title}
                                            onChange={e => updateTranslation(idx, 'title', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                                            placeholder={t.language ? `Title in ${t.language}` : 'Translated title'} />
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
                        <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                            {submitting ? 'Saving...' : frame ? 'Update Frame' : 'Upload Frame'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────── Preview Modal ──────────── */
function PreviewModal({ frame, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{frame.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{frame.category?.name} &middot; {frame.file_name}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 flex items-center justify-center bg-gray-50/50">
                    <img src={STORAGE_URL + frame.file_path} alt={frame.title} className="max-h-[60vh] rounded-lg shadow-md" />
                </div>
            </div>
        </div>
    );
}

/* ──────────── Delete Modal ──────────── */
function DeleteModal({ frame, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center">Delete Frame</h3>
                <p className="text-sm text-gray-500 text-center mt-2">Are you sure you want to delete <span className="font-semibold text-gray-700">{frame.title}</span>? The image file will also be removed.</p>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={() => { onConfirm(frame.id); onClose(); }} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">Delete</button>
                </div>
            </div>
        </div>
    );
}

/* ──────────── Pagination ──────────── */
function Pagination({ current, last, total, onChange }) {
    if (last <= 1) return null;

    const pages = [];
    const delta = 2;
    for (let i = 1; i <= last; i++) {
        if (i === 1 || i === last || (i >= current - delta && i <= current + delta)) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    const btnBase = 'w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all';

    return (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">{total} total frames</p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onChange(current - 1)}
                    disabled={current <= 1}
                    className={`${btnBase} ${current <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                </button>
                {pages.map((p, i) =>
                    p === '...' ? (
                        <span key={`dot-${i}`} className="w-9 h-9 flex items-center justify-center text-gray-400 text-sm">...</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onChange(p)}
                            className={`${btnBase} ${p === current ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            {p}
                        </button>
                    )
                )}
                <button
                    onClick={() => onChange(current + 1)}
                    disabled={current >= last}
                    className={`${btnBase} ${current >= last ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </button>
            </div>
        </div>
    );
}

/* ──────────── Main Page ──────────── */
export default function Frames() {
    const dispatch = useDispatch();
    const { items: frames, pagination, loading, error } = useSelector(s => s.frames);
    const { tree: categoryTree, flat } = useSelector(s => s.categories);
    const categories = flattenTree(categoryTree);

    const [modal, setModal] = useState(null);
    const [previewTarget, setPreviewTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [languageFilter, setLanguageFilter] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);

    // Build unique languages from category translations
    const allLanguages = [...new Set(
        flat.flatMap(c => (c.translations || []).map(t => t.language))
    )].sort();

    const loadFrames = useCallback((params = {}) => {
        dispatch(fetchFrames({
            page: params.page || 1,
            search: params.search ?? search,
            category_id: (params.category_id ?? categoryFilter) || undefined,
            per_page: 12,
        }));
    }, [dispatch, search, categoryFilter]);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchCategoriesFlat());
    }, [dispatch]);

    useEffect(() => {
        loadFrames({ page: 1 });
    }, [categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced search
    const handleSearchChange = (val) => {
        setSearch(val);
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => {
            loadFrames({ page: 1, search: val });
        }, 400));
    };

    const handleSave = async (data) => {
        if (data.id) await dispatch(updateFrame(data));
        else await dispatch(createFrame(data));
        setModal(null);
        loadFrames({ page: pagination.current_page });
    };

    const handleDelete = async (id) => {
        const result = await dispatch(deleteFrame(id));
        if (!result.error) loadFrames({ page: pagination.current_page });
    };

    const handleDownload = (frame) => {
        const link = document.createElement('a');
        link.href = STORAGE_URL + frame.file_path;
        link.download = frame.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Upload Frames</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage and upload category-wise image frames for posters</p>
                </div>
                <button onClick={() => setModal('new')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                    Upload New Frame
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="text-sm text-red-700 flex-1">{error}</p>
                    <button onClick={() => dispatch(clearFrameError())} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Search & Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-sm">
                    <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={e => handleSearchChange(e.target.value)}
                        placeholder="Search frames..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                    />
                </div>

                {/* Category — searchable select */}
                <div className="min-w-[220px]">
                    <SearchableSelect
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        options={categories}
                        placeholder="Search Categories"
                        searchPlaceholder="Search categories..."
                        allowClear
                    />
                </div>

                {/* Language */}
                <select
                    value={languageFilter}
                    onChange={e => setLanguageFilter(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all min-w-[160px]"
                >
                    <option value="">Select Language</option>
                    {allLanguages.map(lang => (
                        <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </div>
            ) : frames.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">No frames found</h3>
                    <p className="text-sm text-gray-400 mt-1">{search || categoryFilter || languageFilter ? 'Try adjusting your search or filters.' : 'Upload your first frame to get started.'}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Frame Title</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Category</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Preview</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Upload Date</th>
                                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {frames.map(frame => (
                                    <tr key={frame.id} className="group hover:bg-gray-50/50 transition-colors">
                                        {/* Title */}
                                        <td className="px-5 py-3.5">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{getFrameTitle(frame, languageFilter)}</p>
                                                <p className="text-[11px] text-gray-400 font-mono mt-0.5">{frame.slug}</p>
                                            </div>
                                        </td>
                                        {/* Category */}
                                        <td className="px-5 py-3.5">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-600 ring-1 ring-violet-500/10">
                                                {getCategoryName(frame.category, languageFilter)}
                                            </span>
                                        </td>
                                        {/* Preview thumbnail */}
                                        <td className="px-5 py-3.5">
                                            <button onClick={() => setPreviewTarget(frame)} className="block">
                                                <img
                                                    src={STORAGE_URL + frame.file_path}
                                                    alt={frame.title}
                                                    className="w-14 h-14 object-cover rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:scale-105 transition-all"
                                                />
                                            </button>
                                        </td>
                                        {/* Upload Date */}
                                        <td className="px-5 py-3.5">
                                            <p className="text-sm text-gray-600">{formatDate(frame.created_at)}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{formatSize(frame.file_size)}</p>
                                        </td>
                                        {/* Actions */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* View */}
                                                <button onClick={() => setPreviewTarget(frame)} title="View"
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </button>
                                                {/* Edit */}
                                                <button onClick={() => setModal(frame)} title="Edit"
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                                                    </svg>
                                                </button>
                                                {/* Download */}
                                                <button onClick={() => handleDownload(frame)} title="Download"
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                    </svg>
                                                </button>
                                                {/* Delete */}
                                                <button onClick={() => setDeleteTarget(frame)} title="Delete"
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
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
                    </div>

                    {/* Pagination */}
                    <div className="px-5 py-3">
                        <Pagination
                            current={pagination.current_page}
                            last={pagination.last_page}
                            total={pagination.total}
                            onChange={(page) => loadFrames({ page })}
                        />
                    </div>
                </div>
            )}

            {/* Modals */}
            {modal && (
                <FrameModal
                    frame={modal === 'new' ? null : modal}
                    categories={categories}
                    allCategories={flat}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}
            {previewTarget && <PreviewModal frame={previewTarget} onClose={() => setPreviewTarget(null)} />}
            {deleteTarget && <DeleteModal frame={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
        </div>
    );
}
