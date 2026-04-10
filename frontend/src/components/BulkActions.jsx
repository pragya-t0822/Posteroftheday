export default function BulkActions({ selectedCount = 0, actions = [], onAction, onClear }) {
    if (selectedCount === 0) return null;

    const variantCls = {
        success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        default: 'bg-white/10 hover:bg-white/20 text-white',
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="flex items-center gap-4 px-5 py-3 bg-gray-900 rounded-2xl shadow-2xl">
                {/* Selected Count */}
                <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 text-white text-xs font-bold">
                        {selectedCount}
                    </span>
                    <span className="text-sm text-white/70 whitespace-nowrap">selected</span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {actions.map((action) => (
                        <button
                            key={action.key}
                            onClick={() => onAction(action.key)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${variantCls[action.variant] || variantCls.default}`}
                        >
                            {action.icon && <span className="w-4 h-4">{action.icon}</span>}
                            {action.label}
                        </button>
                    ))}
                </div>

                {/* Clear Button */}
                <div className="pl-4 border-l border-white/10">
                    <button
                        onClick={onClear}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slide-up {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to   { opacity: 1; transform: translate(-50%, 0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.25s ease-out;
                }
            `}</style>
        </div>
    );
}
