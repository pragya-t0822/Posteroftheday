import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings, saveSettings, clearAppData, clearClearResult } from '../../features/settings/settingsSlice';
import { fetchFonts, createFont, updateFont, deleteFont, toggleFont, setDefaultFont } from '../../features/fonts/fontSlice';
import { alertSuccess, alertError, alertConfirmDelete } from '../../utils/alert';

const STORAGE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') + '/storage/';

const TABS = [
    { key: 'free_poster', label: 'Free Poster Generation', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg> },
    { key: 'clear_data', label: 'Clear App Data', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg> },
    { key: 'fonts', label: 'Fonts', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" /></svg> },
    { key: 'referral', label: 'Referral Program', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg> },
];

/* ══════════════════════════════════════
   Tab 1 — Free Poster Generation
   ══════════════════════════════════════ */
function FreePosterTab({ settings, onSave, saving }) {
    const [enabled, setEnabled] = useState(settings.free_poster_enabled === 'true');
    const [dailyLimit, setDailyLimit] = useState(settings.free_poster_daily_limit || '5');
    const [watermark, setWatermark] = useState(settings.free_poster_watermark === 'true');
    const [quality, setQuality] = useState(settings.free_poster_quality || 'standard');

    useEffect(() => {
        setEnabled(settings.free_poster_enabled === 'true');
        setDailyLimit(settings.free_poster_daily_limit || '5');
        setWatermark(settings.free_poster_watermark === 'true');
        setQuality(settings.free_poster_quality || 'standard');
    }, [settings]);

    const handleSave = () => {
        onSave([
            { key: 'free_poster_enabled', value: String(enabled), group: 'free_poster' },
            { key: 'free_poster_daily_limit', value: dailyLimit, group: 'free_poster' },
            { key: 'free_poster_watermark', value: String(watermark), group: 'free_poster' },
            { key: 'free_poster_quality', value: quality, group: 'free_poster' },
        ]);
    };

    const inputCls = 'px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Enable Free Poster Generation</h3>
                        <p className="text-xs text-gray-400 mt-1">Allow non-subscribed users to generate posters for free with limits</p>
                    </div>
                    <button onClick={() => setEnabled(!enabled)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-rose-500' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            <div className={`bg-white rounded-2xl border border-gray-100 p-6 space-y-5 transition-opacity ${enabled ? '' : 'opacity-50 pointer-events-none'}`}>
                <h3 className="text-sm font-semibold text-gray-900">Free Usage Limits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Free Poster Limit</label>
                        <input type="number" min="1" max="100" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} className={`w-full ${inputCls}`} />
                        <p className="text-[11px] text-gray-400 mt-1">Max posters a free user can generate per day</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Output Quality</label>
                        <select value={quality} onChange={e => setQuality(e.target.value)} className={`w-full ${inputCls}`}>
                            <option value="low">Low (480p)</option>
                            <option value="standard">Standard (720p)</option>
                            <option value="high">High (1080p)</option>
                        </select>
                        <p className="text-[11px] text-gray-400 mt-1">Image quality for free-tier posters</p>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                        <h4 className="text-sm font-medium text-gray-900">Add Watermark</h4>
                        <p className="text-xs text-gray-400 mt-0.5">Show "Poster of the Day" watermark on free posters</p>
                    </div>
                    <button onClick={() => setWatermark(!watermark)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${watermark ? 'bg-rose-500' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${watermark ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════
   Tab 2 — Clear App Data
   ══════════════════════════════════════ */
function ClearDataTab({ settings, onSave, saving, onClear, clearResult }) {
    const [autoClear, setAutoClear] = useState(settings.auto_clear_enabled === 'true');
    const [interval, setInterval_] = useState(settings.auto_clear_interval || 'weekly');
    const [customDays, setCustomDays] = useState(settings.auto_clear_custom_days || '30');
    const [clearing, setClearing] = useState(null);

    useEffect(() => {
        setAutoClear(settings.auto_clear_enabled === 'true');
        setInterval_(settings.auto_clear_interval || 'weekly');
        setCustomDays(settings.auto_clear_custom_days || '30');
    }, [settings]);

    const handleSave = () => {
        onSave([
            { key: 'auto_clear_enabled', value: String(autoClear), group: 'clear_data' },
            { key: 'auto_clear_interval', value: interval, group: 'clear_data' },
            { key: 'auto_clear_custom_days', value: customDays, group: 'clear_data' },
        ]);
    };

    const handleClear = async (type) => {
        setClearing(type);
        await onClear(type);
        setClearing(null);
    };

    const inputCls = 'px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    const clearOptions = [
        { type: 'cache', title: 'Application Cache', desc: 'Clear compiled views, config cache, and route cache', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>, color: 'blue' },
        { type: 'sessions', title: 'User Sessions', desc: 'Force-logout all users and clear active sessions', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>, color: 'amber' },
        { type: 'temp_files', title: 'Temporary Files', desc: 'Remove uploaded temp files from storage', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>, color: 'emerald' },
        { type: 'all', title: 'Clear Everything', desc: 'Clear all cache, sessions, and temp files at once', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>, color: 'red' },
    ];

    const iconBgMap = { blue: 'bg-blue-100 text-blue-600', amber: 'bg-amber-100 text-amber-600', emerald: 'bg-emerald-100 text-emerald-600', red: 'bg-red-100 text-red-600' };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Automatic Data Cleanup</h3>
                        <p className="text-xs text-gray-400 mt-1">Schedule automatic cleanup of temporary data</p>
                    </div>
                    <button onClick={() => setAutoClear(!autoClear)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${autoClear ? 'bg-rose-500' : 'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${autoClear ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${autoClear ? '' : 'opacity-50 pointer-events-none'}`}>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Cleanup Interval</label>
                        <select value={interval} onChange={e => setInterval_(e.target.value)} className={`w-full ${inputCls}`}>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="custom">Custom Duration</option>
                        </select>
                    </div>
                    {interval === 'custom' && (
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Custom (days)</label>
                            <input type="number" min="1" max="365" value={customDays} onChange={e => setCustomDays(e.target.value)} className={`w-full ${inputCls}`} />
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-3 border-t border-gray-100">
                    <button onClick={handleSave} disabled={saving}
                        className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Schedule'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Manual Cleanup</h3>
                <p className="text-xs text-gray-400 mb-5">Clear data immediately — this action cannot be undone</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clearOptions.map(opt => (
                        <button key={opt.type} onClick={() => handleClear(opt.type)} disabled={clearing !== null}
                            className={`flex items-center gap-3 p-4 rounded-xl border border-gray-100 text-left transition-all hover:shadow-sm ${clearing === opt.type ? 'opacity-50' : ''}`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgMap[opt.color]}`}>{opt.icon}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{opt.title}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5">{opt.desc}</p>
                            </div>
                            {clearing === opt.type ? (
                                <svg className="animate-spin w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : (
                                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {clearResult && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-sm text-emerald-700 flex-1">{clearResult.message} — cleared: {clearResult.cleared?.join(', ')}</p>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════
   Tab 3 — Fonts
   ══════════════════════════════════════ */
function FontModal({ font, onClose, onSave }) {
    const [form, setForm] = useState({
        name: font?.name || '', family: font?.family || '',
        is_active: font?.is_active ?? true, is_default: font?.is_default ?? false, sort_order: font?.sort_order ?? 0,
    });
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('family', form.family);
        fd.append('is_active', form.is_active ? '1' : '0');
        fd.append('is_default', form.is_default ? '1' : '0');
        fd.append('sort_order', form.sort_order);
        if (file) fd.append('font_file', file);
        await onSave(font ? { id: font.id, formData: fd } : fd);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{font ? 'Edit Font' : 'Upload Font'}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{font ? 'Update font details' : 'Upload a .ttf, .otf, .woff, or .woff2 file'}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Font File {!font && <span className="text-red-400">*</span>}</label>
                        <label className="block cursor-pointer">
                            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${file ? 'border-rose-200 bg-rose-50/30' : 'border-gray-200 hover:border-rose-300 hover:bg-gray-50'}`}>
                                {file ? (
                                    <div>
                                        <svg className="w-8 h-8 text-rose-400 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                        <p className="text-sm font-medium text-gray-700">{file.name}</p>
                                        <p className="text-[11px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : (
                                    <div className="py-2">
                                        <svg className="w-8 h-8 text-gray-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                        <p className="text-xs text-gray-500">Click to upload font file</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">.ttf, .otf, .woff, .woff2 up to 5MB</p>
                                    </div>
                                )}
                            </div>
                            <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={e => setFile(e.target.files[0])} className="hidden" />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Display Name <span className="text-red-400">*</span></label>
                            <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Roboto Bold" required />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Font Family <span className="text-red-400">*</span></label>
                            <input type="text" value={form.family} onChange={e => set('family', e.target.value)} className={inputCls} placeholder="Roboto" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">Sort Order</label>
                            <input type="number" value={form.sort_order} onChange={e => set('sort_order', e.target.value)} className={inputCls} />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500" />
                                <span className="text-sm text-gray-700 font-medium">Active</span>
                            </label>
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.is_default} onChange={e => set('is_default', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-rose-500 focus:ring-rose-500" />
                                <span className="text-sm text-gray-700 font-medium">Default</span>
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                        <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                            {submitting ? 'Saving...' : font ? 'Update Font' : 'Upload Font'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FontsTab({ fonts, loading, dispatch }) {
    const [modal, setModal] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const handleSave = async (data) => {
        const isEdit = !!data.id;
        const result = isEdit ? await dispatch(updateFont(data)) : await dispatch(createFont(data));
        if (result.error) return alertError(isEdit ? 'Update Failed' : 'Upload Failed', result.payload);
        setModal(null);
        dispatch(fetchFonts());
        alertSuccess(isEdit ? 'Font Updated' : 'Font Uploaded');
    };

    const handleDelete = async (id) => {
        const confirmed = await alertConfirmDelete('this font');
        if (!confirmed) return;
        const result = await dispatch(deleteFont(id));
        if (result.error) return alertError('Delete Failed', result.payload);
        setDeleteId(null);
        alertSuccess('Font Deleted');
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">Manage fonts used across posters and frames. Upload .ttf, .otf, .woff, or .woff2 files.</p>
                <button onClick={() => setModal('new')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all active:scale-[0.98]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Upload Font
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                </div>
            ) : fonts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" /></svg>
                    <h3 className="text-base font-semibold text-gray-900">No fonts uploaded</h3>
                    <p className="text-sm text-gray-400 mt-1">Upload your first font to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fonts.map(font => (
                        <div key={font.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
                            {/* Font preview */}
                            <div className="px-5 py-6 border-b border-gray-50">
                                <p className="text-2xl text-gray-900 truncate" style={font.file_path ? { fontFamily: font.family } : {}}>{font.name}</p>
                                <p className="text-sm text-gray-400 mt-1 truncate" style={font.file_path ? { fontFamily: font.family } : {}}>The quick brown fox jumps over the lazy dog</p>
                                {font.file_path && (
                                    <style>{`@font-face { font-family: '${font.family}'; src: url('${STORAGE_URL}${font.file_path}'); }`}</style>
                                )}
                            </div>
                            {/* Font info & actions */}
                            <div className="px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs text-gray-500 font-mono truncate">{font.family}</span>
                                    {font.is_default && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-500">DEFAULT</span>}
                                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${font.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <span className={`w-1 h-1 rounded-full ${font.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                                        {font.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-0.5 transition-opacity">
                                    {!font.is_default && (
                                        <button onClick={() => dispatch(setDefaultFont(font.id))} title="Set as default"
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                                        </button>
                                    )}
                                    <button onClick={() => dispatch(toggleFont(font.id))} title="Toggle active"
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" /></svg>
                                    </button>
                                    <button onClick={() => setModal(font)} title="Edit"
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                                    </button>
                                    <button onClick={() => setDeleteId(font.id)} title="Delete"
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && <FontModal font={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={handleSave} />}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 text-center">Delete Font</h3>
                        <p className="text-sm text-gray-500 text-center mt-2">Are you sure? The font file will be permanently removed.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                            <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════
   Tab 4 — Referral Program
   ══════════════════════════════════════ */
function ReferralTab({ settings, onSave, saving }) {
    const [rewardAmount, setRewardAmount] = useState(settings.referral_reward_amount || '0');

    useEffect(() => {
        setRewardAmount(settings.referral_reward_amount || '0');
    }, [settings]);

    const handleSave = () => {
        onSave([
            { key: 'referral_reward_amount', value: rewardAmount, group: 'referral' },
        ]);
    };

    const inputCls = 'px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 transition-all';

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900">Referral Reward Configuration</h3>
                    <p className="text-xs text-gray-400 mt-1">Set the reward amount credited to a customer's wallet when their referral is successful</p>
                </div>

                <div className="max-w-sm">
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Reward Per Successful Referral (&#8377;)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={rewardAmount}
                        onChange={e => setRewardAmount(e.target.value)}
                        className={`w-full ${inputCls}`}
                        placeholder="0.00"
                    />
                    <p className="text-[11px] text-gray-400 mt-1.5">This amount will be automatically credited to the referrer's wallet when their referred user completes a successful action</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                        <div>
                            <p className="text-sm font-medium text-amber-800">How it works</p>
                            <ul className="text-xs text-amber-700 mt-1 space-y-1">
                                <li>Each customer gets a unique referral code at registration</li>
                                <li>When a new user signs up using a referral code, a pending referral is created</li>
                                <li>When the referral is marked as successful, the reward amount is credited to the referrer's wallet</li>
                                <li>Changing this value only affects future referrals — existing rewards are not recalculated</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleSave} disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-rose-500 transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════
   Main Settings Page
   ══════════════════════════════════════ */
export default function Settings() {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState('free_poster');
    const { data: settings, loading, saving, clearResult } = useSelector(s => s.settings);
    const { items: fonts, loading: fontsLoading } = useSelector(s => s.fonts);

    useEffect(() => {
        dispatch(fetchSettings());
        dispatch(fetchFonts());
    }, [dispatch]);

    const handleSaveSettings = async (settingsArr) => {
        const result = await dispatch(saveSettings(settingsArr));
        if (result.error) return alertError('Save Failed', result.payload);
        alertSuccess('Settings Saved');
    };
    const handleClearData = async (type) => {
        dispatch(clearClearResult());
        const result = await dispatch(clearAppData(type));
        if (result.error) return alertError('Clear Failed', result.payload);
        alertSuccess('Data Cleared');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">App Settings</h2>
                <p className="text-sm text-gray-400 mt-1">Configure application preferences, data cleanup, and font management</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="border-b border-gray-100">
                    <nav className="flex gap-0 px-2 pt-2">
                        {TABS.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-t-xl transition-all relative ${
                                    activeTab === tab.key
                                        ? 'text-rose-600 bg-rose-50/50 border-b-2 border-rose-500 -mb-px'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}>
                                <span className={activeTab === tab.key ? 'text-rose-500' : 'text-gray-400'}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <svg className="animate-spin h-8 w-8 text-rose-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'free_poster' && <FreePosterTab settings={settings} onSave={handleSaveSettings} saving={saving} />}
                            {activeTab === 'clear_data' && <ClearDataTab settings={settings} onSave={handleSaveSettings} saving={saving} onClear={handleClearData} clearResult={clearResult} />}
                            {activeTab === 'fonts' && <FontsTab fonts={fonts} loading={fontsLoading} dispatch={dispatch} />}
                            {activeTab === 'referral' && <ReferralTab settings={settings} onSave={handleSaveSettings} saving={saving} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
