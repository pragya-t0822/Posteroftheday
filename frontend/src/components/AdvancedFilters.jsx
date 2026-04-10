import { useState, useEffect, useRef, useCallback } from 'react';

export default function AdvancedFilters({
    search = '',
    onSearchChange,
    searchPlaceholder = 'Search...',
    filters = [],
    onFilterChange,
    dateFrom = '',
    dateTo = '',
    onDateChange,
    showDateRange = true,
    onReset,
}) {
    const [localSearch, setLocalSearch] = useState(search);
    const debounceRef = useRef(null);
    const isFirstMount = useRef(true);

    // Sync local search if parent resets it
    useEffect(() => {
        if (search !== localSearch && search === '') {
            setLocalSearch('');
        }
    }, [search]);

    // Debounced search
    const handleSearchInput = useCallback((value) => {
        setLocalSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onSearchChange(value);
        }, 400);
    }, [onSearchChange]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const hasActiveFilters = localSearch || filters.some(f => f.value) || dateFrom || dateTo;

    const selectCls = 'px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all';
    const dateCls = 'px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all';

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
                {/* Search Input */}
                <div className="relative flex-1 min-w-[200px]">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        value={localSearch}
                        onChange={e => handleSearchInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 outline-none focus:bg-white focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                        placeholder={searchPlaceholder}
                    />
                </div>

                {/* Dropdown Filters */}
                {filters.map((filter) => (
                    <select
                        key={filter.key}
                        value={filter.value}
                        onChange={e => onFilterChange(filter.key, e.target.value)}
                        className={selectCls}
                    >
                        <option value="">{filter.label}</option>
                        {filter.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ))}

                {/* Date Range */}
                {showDateRange && (
                    <>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={e => onDateChange('date_from', e.target.value)}
                            className={dateCls}
                            title="From date"
                            placeholder="From"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={e => onDateChange('date_to', e.target.value)}
                            className={dateCls}
                            title="To date"
                            placeholder="To"
                        />
                    </>
                )}

                {/* Reset Button */}
                {hasActiveFilters && (
                    <button
                        onClick={() => {
                            setLocalSearch('');
                            onReset();
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reset
                    </button>
                )}
            </div>
        </div>
    );
}
