import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { createReminder, updateReminder, fetchReminders } from '../../features/reminders/reminderSlice';
import { fetchCategories } from '../../features/categories/categorySlice';
import { fetchFrames } from '../../features/frames/frameSlice';
import { alertSuccess, alertError } from '../../utils/alert';

const STORAGE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') + '/storage/';

export default function ReminderForm() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const { items: allReminders } = useSelector(s => s.reminders);
    const { tree: categoryTree } = useSelector(s => s.categories);
    const { items: allFrames } = useSelector(s => s.frames);

    const [form, setForm] = useState({
        title: '', occasion: '', reminder_date: '', description: '',
        category_ids: [], is_active: true,
    });
    const [selectedPath, setSelectedPath] = useState([]);  // array of selected category IDs at each level
    const [subCategorySearch, setSubCategorySearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchFrames({ per_page: 500 }));
        if (isEdit) dispatch(fetchReminders({ per_page: 100 }));
    }, [dispatch, isEdit]);

    useEffect(() => {
        if (isEdit && allReminders.length > 0 && !loaded) {
            const existing = allReminders.find(r => String(r.id) === String(id));
            if (existing) {
                setForm({
                    title: existing.title || '',
                    occasion: existing.occasion || '',
                    reminder_date: existing.reminder_date || '',
                    description: existing.description || '',
                    category_ids: existing.category_ids || [],
                    is_active: existing.is_active !== undefined ? existing.is_active : true,
                });
                setLoaded(true);
            }
        }
    }, [isEdit, id, allReminders, loaded]);

    const toggleCategoryId = (cid) => {
        setForm(f => ({
            ...f,
            category_ids: f.category_ids.includes(cid) ? f.category_ids.filter(x => x !== cid) : [...f.category_ids, cid],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const data = {
            title: form.title, occasion: form.occasion, reminder_date: form.reminder_date,
            description: form.description, category_ids: form.category_ids,
            is_active: form.is_active ? 1 : 0,
        };
        const result = isEdit
            ? await dispatch(updateReminder({ id: Number(id), ...data }))
            : await dispatch(createReminder(data));
        setSaving(false);
        if (result.error) return alertError(isEdit ? 'Update Failed' : 'Create Failed', result.payload);
        alertSuccess(isEdit ? 'Reminder Updated' : 'Reminder Created');
        navigate('/reminders');
    };

    // Recursively flatten all categories
    const flattenTree = (nodes, parentName = '', parentId = null) => {
        let result = [];
        for (const node of (nodes || [])) {
            result.push({ ...node, parentName, parentId });
            const children = node.recursive_children || node.children || [];
            if (children.length > 0) {
                result = result.concat(flattenTree(children, node.name, node.id));
            }
        }
        return result;
    };
    const allFlat = flattenTree(categoryTree);

    // Build cascading dropdown levels from selectedPath
    const getChildrenOfId = (catId, nodes) => {
        for (const n of (nodes || [])) {
            if (String(n.id) === String(catId)) return n.recursive_children || n.children || [];
            const found = getChildrenOfId(catId, n.recursive_children || n.children || []);
            if (found) return found;
        }
        return null;
    };

    const getCategoryById = (catId, nodes) => {
        for (const n of (nodes || [])) {
            if (String(n.id) === String(catId)) return n;
            const found = getCategoryById(catId, n.recursive_children || n.children || []);
            if (found) return found;
        }
        return null;
    };

    // Build dropdown levels: level 0 = root categories, level 1 = children of selectedPath[0], etc.
    const dropdownLevels = [];
    // Level 0: root parents
    dropdownLevels.push({ label: 'Parent Category', options: categoryTree || [], selectedId: selectedPath[0] || '' });
    // Subsequent levels based on selectedPath
    for (let i = 0; i < selectedPath.length; i++) {
        const children = getChildrenOfId(selectedPath[i], categoryTree) || [];
        if (children.length > 0) {
            const parentNode = getCategoryById(selectedPath[i], categoryTree);
            dropdownLevels.push({
                label: `${parentNode?.name || 'Sub'}-Category`,
                options: children,
                selectedId: selectedPath[i + 1] || '',
            });
        }
    }

    const handleDropdownChange = (levelIndex, value) => {
        const newPath = selectedPath.slice(0, levelIndex);
        if (value) newPath.push(value);
        setSelectedPath(newPath);
        setSubCategorySearch('');
    };

    // Get the deepest selected category's direct children for the grid
    const deepestSelectedId = selectedPath[selectedPath.length - 1];
    const deepestNode = deepestSelectedId ? getCategoryById(deepestSelectedId, categoryTree) : null;
    const deepestChildren = deepestNode ? (deepestNode.recursive_children || deepestNode.children || []) : [];

    // Items to show in the grid: the direct children of the deepest selected dropdown
    // If deepest has no children, show nothing (it's a leaf — user can select it via dropdown)
    const gridItems = deepestChildren;

    // Filter by search
    const filteredGridItems = subCategorySearch
        ? gridItems.filter(c => c.name?.toLowerCase().includes(subCategorySearch.toLowerCase()))
        : gridItems;

    // Get thumbnail for a category — try: direct match, then match by name, then parent's frames
    const getCategoryThumb = (catId, catName, parentId) => {
        const frames = allFrames || [];
        // 1. Frame directly in this category
        let frame = frames.find(f => f.category_id === catId && f.file_path);
        if (frame) return STORAGE_URL + frame.file_path;
        // 2. Frame whose title matches category name (e.g., frame "Diwali" for category "Diwali")
        if (catName) {
            frame = frames.find(f => f.title?.toLowerCase() === catName.toLowerCase() && f.file_path);
            if (frame) return STORAGE_URL + frame.file_path;
        }
        // 3. Any frame in the parent category
        if (parentId) {
            frame = frames.find(f => f.category_id === parentId && f.file_path);
            if (frame) return STORAGE_URL + frame.file_path;
        }
        return null;
    };

    // Selected categories resolved
    const selectedCategories = allFlat.filter(c => form.category_ids.includes(c.id));

    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/reminders')}
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                </button>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{isEdit ? 'Edit Reminder' : 'New Reminder'}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Schedule priority categories for a specific date or occasion</p>
                </div>
                <div className="flex items-center gap-3">
                    <button type="button" onClick={() => navigate('/reminders')}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50 active:scale-[0.98]">
                        {saving ? 'Saving...' : isEdit ? 'Update Reminder' : 'Create Reminder'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ── Left: Form + Preview ── */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Details Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                            Reminder Details
                        </h3>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Title <span className="text-red-400">*</span></label>
                            <input type="text" value={form.title} onChange={e => set('title', e.target.value)} className={inputCls} placeholder="e.g., Diwali Special Posters" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Occasion</label>
                            <input type="text" value={form.occasion} onChange={e => set('occasion', e.target.value)} className={inputCls} placeholder="e.g., Diwali, New Year" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Date <span className="text-red-400">*</span></label>
                            <input type="date" value={form.reminder_date} onChange={e => set('reminder_date', e.target.value)} className={inputCls} required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                            <textarea value={form.description} onChange={e => set('description', e.target.value)} className={inputCls + ' resize-none'} rows={2} placeholder="Optional notes..." />
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div>
                                <p className="text-xs font-medium text-gray-700">Active</p>
                                <p className="text-[11px] text-gray-400">Will trigger on the selected date</p>
                            </div>
                            <button type="button" onClick={() => set('is_active', !form.is_active)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Live Preview
                            {selectedCategories.length > 0 && <span className="ml-auto text-xs text-gray-400 font-normal">{selectedCategories.length} selected</span>}
                        </h3>

                        {selectedCategories.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                                <p className="text-xs text-gray-400">Select categories to preview</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {selectedCategories.map(c => {
                                    const thumb = getCategoryThumb(c.id, c.name, c.parentId || c.parent_id);
                                    return (
                                        <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100 group">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                                                {thumb ? (
                                                    <img src={thumb} alt={c.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                                                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                                                <p className="text-[11px] text-gray-400">{c.parentName}</p>
                                            </div>
                                            <button type="button" onClick={() => toggleCategoryId(c.id)}
                                                className="w-6 h-6 rounded-full bg-gray-200 hover:bg-red-500 hover:text-white text-gray-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Category Selection ── */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header + Cascading Dropdowns */}
                        <div className="p-5 border-b border-gray-100 space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                                Select Categories
                                {form.category_ids.length > 0 && <span className="ml-auto text-xs font-normal text-rose-500">({form.category_ids.length} selected)</span>}
                            </h3>

                            {/* Cascading Dropdowns */}
                            <div className="flex flex-wrap items-end gap-3">
                                {dropdownLevels.map((level, idx) => (
                                    <div key={idx} className="flex-1 min-w-[180px]">
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">{level.label}</label>
                                        <select
                                            value={level.selectedId}
                                            onChange={e => handleDropdownChange(idx, e.target.value)}
                                            className={inputCls}
                                        >
                                            <option value="">— Select —</option>
                                            {level.options.map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>

                            {/* Breadcrumb Path */}
                            {selectedPath.length > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                                    {selectedPath.map((catId, idx) => {
                                        const node = getCategoryById(catId, categoryTree);
                                        return (
                                            <span key={catId} className="flex items-center gap-1.5">
                                                {idx > 0 && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>}
                                                <span className={idx === selectedPath.length - 1 ? 'text-emerald-600 font-semibold' : ''}>{node?.name || catId}</span>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Search within current level */}
                            {gridItems.length > 0 && (
                                <div className="relative">
                                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                    <input type="text" value={subCategorySearch} onChange={e => setSubCategorySearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                                        placeholder={`Search in ${deepestNode?.name || 'sub-categories'}...`} />
                                </div>
                            )}
                        </div>

                        {/* Sub-categories Grid */}
                        <div className="p-5 max-h-[480px] overflow-y-auto">
                            {selectedPath.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-900">Select a category</h3>
                                    <p className="text-xs text-gray-400 mt-1">Choose from the dropdowns above to browse sub-categories</p>
                                </div>
                            ) : gridItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-900">{deepestNode?.name} — Leaf Category</h3>
                                    <p className="text-xs text-gray-400 mt-1">No further sub-categories. You can select this category using the checkbox below.</p>
                                    <button type="button" onClick={() => toggleCategoryId(Number(deepestSelectedId))}
                                        className={`mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.category_ids.includes(Number(deepestSelectedId)) ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-gray-900 text-white hover:bg-rose-500'}`}>
                                        {form.category_ids.includes(Number(deepestSelectedId)) ? (
                                            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Selected</>
                                        ) : (
                                            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> Select {deepestNode?.name}</>
                                        )}
                                    </button>
                                </div>
                            ) : filteredGridItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                    <p className="text-sm text-gray-400">No results for "{subCategorySearch}"</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {filteredGridItems.map(cat => {
                                        const selected = form.category_ids.includes(cat.id);
                                        const thumb = getCategoryThumb(cat.id, cat.name, cat.parent_id);
                                        return (
                                            <button key={cat.id} type="button" onClick={() => toggleCategoryId(cat.id)}
                                                className={`group relative rounded-xl border-2 overflow-hidden transition-all text-left ${selected ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm' : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'}`}>
                                                <div className="aspect-[4/3] bg-gray-100 relative">
                                                    {thumb ? (
                                                        <img src={thumb} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                                                    ) : (
                                                        <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                                                            <svg className="w-8 h-8 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
                                                        </div>
                                                    )}
                                                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${selected ? 'bg-emerald-500 shadow-md' : 'bg-white/80 border border-gray-200 opacity-0 group-hover:opacity-100'}`}>
                                                        {selected ? (
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                        ) : (
                                                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="px-2.5 py-2">
                                                    <p className="text-xs font-semibold text-gray-900 truncate">{cat.name}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
