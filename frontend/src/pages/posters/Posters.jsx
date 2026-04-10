import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFrameLayers, createFrameLayer, updateFrameLayer, deleteFrameLayer, toggleFrameLayer, clearFrameLayerError } from '../../features/frameLayers/frameLayerSlice';
import { fetchCategories, fetchCategoriesFlat } from '../../features/categories/categorySlice';
import { fetchFrames } from '../../features/frames/frameSlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';
import axiosInstance from '../../api/axios';
import AdvancedFilters from '../../components/AdvancedFilters';
import PaginationShared from '../../components/Pagination';

const STORAGE_URL = (import.meta.env.VITE_API_URL?.replace('/api', '') || '') + '/storage/';
const LANGUAGES = ['Hindi', 'English', 'Marathi'];

/* ──────────── Image with fallback placeholder ──────────── */
function ImageWithFallback({ src, alt, className, fallbackClassName }) {
    const [failed, setFailed] = useState(false);
    if (failed || !src) {
        return (
            <div className={fallbackClassName || 'w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center'}>
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
            </div>
        );
    }
    return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
const PARAM_TYPES = [
    { value: 'photo', label: 'Photo Upload' },
    { value: 'text', label: 'Text Field' },
];
const LABEL_OPTIONS = [
    { value: 'Facebook', icon: 'facebook' },
    { value: 'Instagram', icon: 'instagram' },
    { value: 'Twitter / X', icon: 'twitter' },
    { value: 'YouTube', icon: 'youtube' },
    { value: 'WhatsApp', icon: 'whatsapp' },
    { value: 'Website URL', icon: 'website' },
    { value: 'Phone Number', icon: 'phone' },
    { value: 'Email Address', icon: 'mail' },
];

/* ──────────── Helpers ──────────── */
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

function getLayerTitle(layer, lang) {
    if (!lang) return layer.title;
    const t = (layer.translations || []).find(tr => tr.language.toLowerCase() === lang.toLowerCase());
    return t ? t.title : layer.title;
}

function getCategoryName(category, lang) {
    if (!category) return '—';
    if (!lang) return category.name;
    const t = (category.translations || []).find(tr => tr.language.toLowerCase() === lang.toLowerCase());
    return t ? t.name : category.name;
}

function getParamIcon(type) {
    const icons = {
        photo: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>,
        text: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
        facebook: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
        instagram: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
        twitter: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
        youtube: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
        whatsapp: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
        website: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
        phone: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>,
        mail: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
    };
    return icons[type] || icons.text;
}

function getParamTypeLabel(type) {
    return PARAM_TYPES.find(p => p.value === type)?.label || type;
}

function getLabelIcon(label) {
    const match = LABEL_OPTIONS.find(o => o.value === label);
    return match ? getParamIcon(match.icon) : null;
}

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const formatSize = (b) => b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(1) + ' MB';

/* ──────────── Searchable Select Dropdown ──────────── */
function SearchableSelect({ value, onChange, options, placeholder = 'Select...', allowClear = false, searchPlaceholder = 'Search...' }) {
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

    useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

    const filtered = query ? options.filter(o => (o.name || '').toLowerCase().includes(query.toLowerCase())) : options;

    const handleSelect = (id) => { onChange(id); setOpen(false); setQuery(''); };

    return (
        <div ref={ref} className="relative">
            <button type="button" onClick={() => { setOpen(!open); setQuery(''); }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-left outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                <span className={`flex-1 truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>{selected ? selected.name : placeholder}</span>
                {allowClear && selected ? (
                    <span onClick={(e) => { e.stopPropagation(); handleSelect(''); }} className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </span>
                ) : (
                    <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                )}
            </button>
            {open && (
                <div className="absolute z-40 mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                            <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder={searchPlaceholder}
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:ring-1 focus:ring-rose-500/20 transition-all" />
                        </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                        {filtered.length === 0 ? (
                            <p className="px-4 py-3 text-sm text-gray-400 text-center">No results found</p>
                        ) : filtered.map(o => (
                            <button key={o.id} type="button" onClick={() => handleSelect(o.id)}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${String(o.id) === String(value) ? 'bg-rose-50 text-rose-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}>
                                <span className="font-mono text-gray-300 text-xs whitespace-pre">{(o.label || '').slice(0, (o.label || '').length - (o.name || '').length)}</span>
                                <span>{o.name}</span>
                                {String(o.id) === String(value) && <svg className="w-4 h-4 text-rose-500 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ──────────── Add / Edit Modal ──────────── */
function LayerModal({ layer, frames, categories, onClose, onSave }) {
    const [form, setForm] = useState({
        title: layer?.title || '',
        slug: layer?.slug || '',
        frame_id: layer?.frame_id || '',
        is_active: layer?.is_active ?? true,
        sort_order: layer?.sort_order ?? 0,
    });
    const [translations, setTranslations] = useState(
        layer?.translations?.length
            ? layer.translations.map(t => ({ language: t.language, title: t.title }))
            : []
    );
    const [parameters, setParameters] = useState(
        layer?.parameters?.length ? layer.parameters : []
    );
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(layer?.file_path ? STORAGE_URL + layer.file_path : null);
    const [submitting, setSubmitting] = useState(false);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    const autoSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const handleNameChange = (val) => { set('title', val); if (!layer) set('slug', autoSlug(val)); };

    const handleFile = (e) => {
        const f = e.target.files[0];
        if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
    };

    // Translation handlers
    const addTranslation = () => setTranslations(t => [...t, { language: '', title: '' }]);
    const updateTranslation = (idx, key, val) => setTranslations(t => t.map((item, i) => i === idx ? { ...item, [key]: val } : item));
    const removeTranslation = (idx) => setTranslations(t => t.filter((_, i) => i !== idx));

    // Parameter handlers
    const addParameter = () => setParameters(p => [...p, { type: 'text', label: '', placeholder: '', required: false, position: { x: 50, y: 50 } }]);
    const updateParameter = (idx, key, val) => setParameters(p => p.map((item, i) => i === idx ? { ...item, [key]: val } : item));
    const updateParamPosition = (idx, axis, val) => setParameters(p => p.map((item, i) => i === idx ? { ...item, position: { ...item.position, [axis]: Number(val) } } : item));
    const removeParameter = (idx) => setParameters(p => p.filter((_, i) => i !== idx));

    // Frame options list
    const frameOptions = frames.map(f => ({ id: f.id, name: f.title }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const fd = new FormData();
        fd.append('title', form.title);
        fd.append('slug', form.slug);
        fd.append('frame_id', form.frame_id);
        fd.append('is_active', form.is_active ? '1' : '0');
        fd.append('sort_order', form.sort_order);
        const validTranslations = translations.filter(t => t.language.trim() && t.title.trim()).map(({ language, title }) => ({ language, title }));
        fd.append('translations', JSON.stringify(validTranslations));
        const validParams = parameters.filter(p => p.type).map(({ type, label, placeholder, required, position }) => ({ type, label: label && label !== '__custom__' ? label : getParamTypeLabel(type), placeholder: placeholder || '', required: !!required, position: position || { x: 50, y: 50 } }));
        fd.append('parameters', JSON.stringify(validParams));
        if (file) fd.append('layer', file);
        await onSave(layer ? { id: layer.id, formData: fd } : fd);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{layer ? 'Edit Frame Layer' : 'Add Frame Layer'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{layer ? 'Update layer details and parameters' : 'Upload an image layer with dynamic customer fields'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
                    {/* File Upload */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Layer Image {!layer && <span className="text-red-400">*</span>}</label>
                        <label className="block cursor-pointer">
                            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${preview ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200 hover:border-rose-300 hover:bg-gray-50'}`}>
                                {preview ? (
                                    <div className="relative inline-block">
                                        <img src={preview} alt="Preview" className="max-h-36 rounded-lg mx-auto shadow-sm" />
                                        <span className="block text-xs text-gray-400 mt-2">{file ? file.name : layer?.file_name}</span>
                                    </div>
                                ) : (
                                    <div className="py-4">
                                        <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                        <p className="text-sm text-gray-500">Click to upload layer image</p>
                                        <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WebP, SVG up to 5MB</p>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                        </label>
                    </div>

                    {/* Title / Slug */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Title <span className="text-red-400">*</span></label>
                            <input type="text" value={form.title} onChange={e => handleNameChange(e.target.value)} className={inputCls} placeholder="Layer Title" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Slug</label>
                            <input type="text" value={form.slug} onChange={e => set('slug', e.target.value)} className={inputCls} placeholder="layer-slug" required />
                        </div>
                    </div>

                    {/* Frame selector */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Frame <span className="text-red-400">*</span></label>
                        <SearchableSelect value={form.frame_id} onChange={(id) => set('frame_id', id)} options={frameOptions} placeholder="Select frame" searchPlaceholder="Search frames..." />
                    </div>

                    {/* Title Translations */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-500">Title Translations</label>
                            <button type="button" onClick={addTranslation} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                Add Language
                            </button>
                        </div>
                        {translations.length === 0 ? (
                            <div className="border border-dashed border-gray-200 rounded-xl px-4 py-3 text-center">
                                <p className="text-xs text-gray-400">No translations yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {translations.map((t, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <select value={t.language} onChange={e => updateTranslation(idx, 'language', e.target.value)}
                                            className="w-[130px] px-2.5 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all">
                                            <option value="">Language</option>
                                            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                        <input type="text" value={t.title} onChange={e => updateTranslation(idx, 'title', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                                            placeholder={t.language ? `Title in ${t.language}` : 'Translated title'} />
                                        <button type="button" onClick={() => removeTranslation(idx)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Customer Parameters */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Customer Parameters</label>
                                <p className="text-[11px] text-gray-400 mt-0.5">Define fields customers fill in — photo uploads or text inputs with social media labels</p>
                            </div>
                            <button type="button" onClick={addParameter} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                Add Field
                            </button>
                        </div>
                        {parameters.length === 0 ? (
                            <div className="border border-dashed border-gray-200 rounded-xl px-4 py-3 text-center">
                                <p className="text-xs text-gray-400">No customer parameters defined.</p>
                                <button type="button" onClick={addParameter} className="text-xs font-semibold text-rose-500 hover:text-rose-600 mt-1 transition-colors">+ Add Photo Upload or Text Field</button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {parameters.map((p, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                        {/* Row 1: Type + Label (text input) + Remove */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <select value={p.type} onChange={e => updateParameter(idx, 'type', e.target.value)}
                                                className="w-[140px] px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all">
                                                {PARAM_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
                                            </select>
                                            <input type="text" value={p.label} onChange={e => updateParameter(idx, 'label', e.target.value)}
                                                className="flex-1 px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all"
                                                placeholder="Label (e.g. Facebook, Phone Number)" />
                                            <button type="button" onClick={() => removeParameter(idx)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                        {/* Row 2: Placeholder */}
                                        <div className="mb-2">
                                            <input type="text" value={p.placeholder || ''} onChange={e => updateParameter(idx, 'placeholder', e.target.value)}
                                                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 placeholder-gray-400 outline-none focus:border-rose-500 transition-all"
                                                placeholder="Placeholder text" />
                                        </div>
                                        {/* Row 3: Position + Required */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <label className="text-[11px] text-gray-500">X:</label>
                                                <input type="number" min="0" max="100" value={p.position?.x ?? 50} onChange={e => updateParamPosition(idx, 'x', e.target.value)}
                                                    className="w-16 px-2 py-1 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 outline-none focus:border-rose-500 transition-all" />
                                                <label className="text-[11px] text-gray-500">Y:</label>
                                                <input type="number" min="0" max="100" value={p.position?.y ?? 50} onChange={e => updateParamPosition(idx, 'y', e.target.value)}
                                                    className="w-16 px-2 py-1 rounded-lg border border-gray-200 bg-white text-xs text-gray-900 outline-none focus:border-rose-500 transition-all" />
                                                <span className="text-[10px] text-gray-400">%</span>
                                            </div>
                                            {/* Type indicator badge */}
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${p.type === 'photo' ? 'bg-violet-50 text-violet-600' : 'bg-sky-50 text-sky-600'}`}>
                                                {p.type === 'photo' ? getParamIcon('photo') : getParamIcon('text')}
                                                {p.type === 'photo' ? 'Image' : 'Text'}
                                            </span>
                                            <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                                                <input type="checkbox" checked={p.required || false} onChange={e => updateParameter(idx, 'required', e.target.checked)}
                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-rose-500 focus:ring-rose-500" />
                                                <span className="text-[11px] text-gray-500 font-medium">Required</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort / Active */}
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

                    {/* Actions */}
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                            {submitting ? 'Saving...' : layer ? 'Update Layer' : 'Add Frame Layer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ──────────── Preview Modal (with dynamic parameter overlays) ──────────── */
function PreviewModal({ layer, onClose }) {
    const params = layer.parameters || [];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{layer.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{layer.frame?.title} &middot; {layer.frame?.category?.name || '—'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6 bg-gray-50/50">
                    {/* Layer image with dynamic parameter overlays */}
                    <div className="relative inline-block mx-auto w-full">
                        <ImageWithFallback
                            src={layer.file_path ? STORAGE_URL + layer.file_path : null}
                            alt={layer.title}
                            className="w-full max-h-[55vh] object-contain rounded-lg shadow-md mx-auto block"
                            fallbackClassName="w-48 h-48 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center mx-auto"
                        />
                        {/* Dynamic overlays — photo as image placeholder, text as text overlay */}
                        {params.map((p, idx) => (
                            <div key={idx}
                                className="absolute pointer-events-none"
                                style={{ left: `${p.position?.x ?? 50}%`, top: `${p.position?.y ?? 50}%`, transform: 'translate(-50%,-50%)' }}>
                                {p.type === 'photo' ? (
                                    /* Photo Upload — renders as circular image placeholder */
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-16 h-16 rounded-full bg-white/80 backdrop-blur-sm border-2 border-dashed border-rose-300 flex items-center justify-center shadow-lg">
                                            <svg className="w-6 h-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
                                        </div>
                                        <span className="text-[9px] font-bold text-white bg-rose-500/80 backdrop-blur-sm px-2 py-0.5 rounded-full shadow">{p.label || 'Photo'}</span>
                                    </div>
                                ) : (
                                    /* Text Field — renders as text overlay with label icon */
                                    <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg border border-gray-200">
                                        {getLabelIcon(p.label) && <span className="text-rose-500">{getLabelIcon(p.label)}</span>}
                                        <span className="text-[11px] font-semibold text-gray-800 whitespace-nowrap">{p.placeholder || p.label || 'Text'}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Parameter summary cards */}
                    {params.length > 0 && (
                        <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer Input Fields</p>
                            <div className="grid grid-cols-2 gap-2">
                                {params.map((p, idx) => (
                                    <div key={idx} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${p.type === 'photo' ? 'bg-violet-50/50 border-violet-100' : 'bg-sky-50/50 border-sky-100'}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.type === 'photo' ? 'bg-violet-100 text-violet-600' : 'bg-sky-100 text-sky-600'}`}>
                                            {p.type === 'photo' ? getParamIcon('photo') : (getLabelIcon(p.label) || getParamIcon('text'))}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-gray-800 truncate">{p.label || getParamTypeLabel(p.type)}</p>
                                            <p className="text-[10px] text-gray-400">{p.type === 'photo' ? 'Image upload' : 'Text input'}{p.required ? ' · Required' : ''}</p>
                                        </div>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${p.type === 'photo' ? 'bg-violet-100 text-violet-600' : 'bg-sky-100 text-sky-600'}`}>
                                            {p.position?.x},{p.position?.y}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ──────────── Delete Modal ──────────── */
function DeleteModal({ layer, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 text-center">Delete Frame Layer</h3>
                <p className="text-sm text-gray-500 text-center mt-2">Are you sure you want to delete <span className="font-semibold text-gray-700">{layer.title}</span>? This action cannot be undone.</p>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={() => onConfirm(layer.id)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">Delete</button>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════ */
export default function Posters() {
    const dispatch = useDispatch();
    const { items: layers, pagination, loading, error } = useSelector(s => s.frameLayers);
    const { items: allFrames } = useSelector(s => s.frames);
    const { tree: categoryTree, flat: categoriesFlat } = useSelector(s => s.categories);
    const categories = flattenTree(categoryTree);

    const [modal, setModal] = useState(null);
    const [previewTarget, setPreviewTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [frameFilter, setFrameFilter] = useState('');
    const [languageFilter, setLanguageFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Build frame options for filter dropdown
    const frameOptions = allFrames.map(f => ({ value: String(f.id), label: f.title }));

    const loadLayers = useCallback((params = {}) => {
        dispatch(fetchFrameLayers({
            page: params.page || 1,
            search: params.search ?? search,
            category_id: (params.category_id ?? categoryFilter) || undefined,
            language: (params.language ?? languageFilter) || undefined,
            status: (params.status ?? statusFilter) || undefined,
            frame_id: (params.frame_id ?? frameFilter) || undefined,
            date_from: params.date_from ?? dateFrom,
            date_to: params.date_to ?? dateTo,
            per_page: 12,
        }));
    }, [dispatch, search, categoryFilter, languageFilter, statusFilter, frameFilter, dateFrom, dateTo]);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchCategoriesFlat());
        dispatch(fetchFrames({ per_page: 1000 }));
    }, [dispatch]);

    useEffect(() => { loadLayers({ page: 1 }); }, [categoryFilter, languageFilter, statusFilter, frameFilter, dateFrom, dateTo]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearchChange = (val) => {
        setSearch(val);
        loadLayers({ page: 1, search: val });
    };

    // Build category options for AdvancedFilters dropdown (with hierarchy)
    const categoryOptions = categories.map(c => ({
        value: String(c.id),
        label: (c.depth > 0 ? '\u00A0\u00A0'.repeat(c.depth) + '└ ' : '') + c.name,
    }));

    const handleFilterChange = (key, value) => {
        if (key === 'category') setCategoryFilter(value);
        if (key === 'status') setStatusFilter(value);
        if (key === 'frame') setFrameFilter(value);
    };

    const handleDateChange = (key, value) => {
        if (key === 'date_from') setDateFrom(value);
        if (key === 'date_to') setDateTo(value);
    };

    const handleReset = () => {
        setSearch('');
        setCategoryFilter('');
        setStatusFilter('');
        setFrameFilter('');
        setLanguageFilter('');
        setDateFrom('');
        setDateTo('');
        dispatch(fetchFrameLayers({ page: 1, per_page: 12 }));
    };

    const handleSave = async (data) => {
        const isEdit = !!data.id;
        const result = isEdit ? await dispatch(updateFrameLayer(data)) : await dispatch(createFrameLayer(data));
        if (result.error) return alertError(isEdit ? 'Update Failed' : 'Upload Failed', result.payload);
        setModal(null);
        loadLayers({ page: pagination.current_page });
        alertSuccess(isEdit ? 'Frame Layer Updated' : 'Frame Layer Created');
    };

    const handleDelete = async (id) => {
        const result = await dispatch(deleteFrameLayer(id));
        if (result.error) return alertError('Delete Failed', result.payload);
        setDeleteTarget(null);
        loadLayers({ page: pagination.current_page });
        alertSuccess('Frame Layer Deleted');
    };

    const handleToggle = async (id) => {
        await dispatch(toggleFrameLayer(id));
    };

    const handleDownload = async (layer) => {
        if (!layer.file_path) return alertError('Download Failed', 'No file available for this layer');
        try {
            const res = await axiosInstance.get(`/frame-layers/${layer.id}/download`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = layer.file_name || layer.file_path.split('/').pop() || 'frame-layer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch {
            alertError('Download Failed', 'Could not download the file');
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Frame Layers</h2>
                    <p className="text-sm text-gray-400 mt-1">Manage image layers with dynamic customer fields for poster generation</p>
                </div>
                <button onClick={() => setModal('new')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98] shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Add Frame Layer
                </button>
            </div>

            {/* ── Error banner ── */}
            {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                    <p className="text-sm text-red-700 flex-1">{error}</p>
                    <button onClick={() => dispatch(clearFrameLayerError())} className="text-red-400 hover:text-red-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Advanced Filters */}
            <AdvancedFilters
                search={search}
                onSearchChange={handleSearchChange}
                searchPlaceholder="Search frame layers..."
                filters={[
                    {
                        key: 'category',
                        label: 'All Categories',
                        value: categoryFilter,
                        options: categoryOptions,
                    },
                    {
                        key: 'status',
                        label: 'All Status',
                        value: statusFilter,
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'inactive', label: 'Inactive' },
                        ],
                    },
                    {
                        key: 'frame',
                        label: 'All Frames',
                        value: frameFilter,
                        options: frameOptions,
                    },
                ]}
                onFilterChange={handleFilterChange}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateChange={handleDateChange}
                onReset={handleReset}
            />

            {/* ── Table ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </div>
            ) : layers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                    <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25L12 17.25 2.25 12l4.179-2.25m11.142 0l4.179 2.25L12 22.5l-9.75-5.25 4.179-2.25" /></svg>
                    <h3 className="text-lg font-semibold text-gray-900">No frame layers found</h3>
                    <p className="text-sm text-gray-400 mt-1">{search || categoryFilter || languageFilter ? 'Try adjusting your search or filters.' : 'Add your first frame layer to get started.'}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Frame Title</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Category</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Language</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Preview</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Parameters</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Upload Date</th>
                                    <th className="text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Status</th>
                                    <th className="text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {layers.map(layer => {
                                    const params = layer.parameters || [];
                                    const translationLangs = (layer.translations || []).map(t => t.language);
                                    return (
                                        <tr key={layer.id} className="group hover:bg-gray-50/60 transition-colors">
                                            {/* Frame Title */}
                                            <td className="px-5 py-3.5">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{getLayerTitle(layer, languageFilter)}</p>
                                                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{layer.slug}</p>
                                                </div>
                                            </td>
                                            {/* Category */}
                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-violet-50 text-violet-600 ring-1 ring-violet-500/10">
                                                    {getCategoryName(layer.frame?.category, languageFilter)}
                                                </span>
                                            </td>
                                            {/* Language */}
                                            <td className="px-5 py-3.5">
                                                {translationLangs.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {translationLangs.map(lang => (
                                                            <span key={lang} className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-600 ring-1 ring-blue-500/10">
                                                                {lang}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            {/* Preview */}
                                            <td className="px-5 py-3.5">
                                                <button onClick={() => setPreviewTarget(layer)} className="block">
                                                    <ImageWithFallback
                                                        src={layer.file_path ? STORAGE_URL + layer.file_path : null}
                                                        alt={layer.title}
                                                        className="w-14 h-14 object-cover rounded-lg border border-gray-100 shadow-sm hover:shadow-md hover:scale-105 transition-all"
                                                    />
                                                </button>
                                            </td>
                                            {/* Parameters */}
                                            <td className="px-5 py-3.5">
                                                {params.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                                                        {params.map((p, idx) => (
                                                            <span key={idx} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium ring-1 ${p.type === 'photo' ? 'bg-violet-50 text-violet-700 ring-violet-500/10' : 'bg-sky-50 text-sky-700 ring-sky-500/10'}`} title={`${getParamTypeLabel(p.type)}: ${p.label || '—'}`}>
                                                                <span className={p.type === 'photo' ? 'text-violet-500' : 'text-sky-500'}>{p.type === 'photo' ? getParamIcon('photo') : (getLabelIcon(p.label) || getParamIcon('text'))}</span>
                                                                {p.label || getParamTypeLabel(p.type)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400">None</span>
                                                )}
                                            </td>
                                            {/* Upload Date */}
                                            <td className="px-5 py-3.5">
                                                <p className="text-sm text-gray-600">{formatDate(layer.created_at)}</p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">{formatSize(layer.file_size)}</p>
                                            </td>
                                            {/* Status */}
                                            <td className="px-5 py-3.5">
                                                <button onClick={() => handleToggle(layer.id)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                                                        layer.is_active
                                                            ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20 hover:bg-emerald-100'
                                                            : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200 hover:bg-gray-200'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${layer.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                                    {layer.is_active ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-1 transition-opacity">
                                                    {/* View */}
                                                    <button onClick={() => setPreviewTarget(layer)} title="View"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    </button>
                                                    {/* Edit */}
                                                    <button onClick={() => setModal(layer)} title="Edit"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                                                    </button>
                                                    {/* Download */}
                                                    <button onClick={() => handleDownload(layer)} title="Download"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                                                    </button>
                                                    {/* Delete */}
                                                    <button onClick={() => setDeleteTarget(layer)} title="Delete"
                                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {!loading && layers.length > 0 && (
                        <PaginationShared pagination={pagination} onPageChange={(page) => loadLayers({ page })} itemLabel="frame layers" />
                    )}
                </div>
            )}

            {/* ── Modals ── */}
            {modal && (
                <LayerModal
                    layer={modal === 'new' ? null : modal}
                    frames={allFrames}
                    categories={categories}
                    onClose={() => setModal(null)}
                    onSave={handleSave}
                />
            )}
            {previewTarget && <PreviewModal layer={previewTarget} onClose={() => setPreviewTarget(null)} />}
            {deleteTarget && <DeleteModal layer={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}

        </div>
    );
}
