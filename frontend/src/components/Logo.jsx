export default function Logo({ size = 40, className = '' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Background rounded square */}
            <rect width="120" height="120" rx="28" fill="url(#logo-bg)" />

            {/* Poster frame */}
            <rect x="28" y="22" width="64" height="76" rx="8" fill="white" fillOpacity="0.15" />
            <rect x="32" y="26" width="56" height="68" rx="5" fill="white" fillOpacity="0.95" />

            {/* Mountain/landscape scene inside poster */}
            <path d="M32 78 L50 54 L62 68 L70 58 L88 78 L88 89 C88 91.76 85.76 94 83 94 L37 94 C34.24 94 32 91.76 32 89 Z" fill="url(#scene-gradient)" />
            <path d="M62 68 L70 58 L88 78 L88 89 C88 91.76 85.76 94 83 94 L60 94 Z" fill="url(#scene-gradient-2)" />

            {/* Sun */}
            <circle cx="72" cy="42" r="9" fill="url(#sun-gradient)" />

            {/* Star sparkle — top right */}
            <path d="M96 16 L98 22 L104 24 L98 26 L96 32 L94 26 L88 24 L94 22 Z" fill="white" fillOpacity="0.9" />
            <path d="M18 72 L19.5 76 L24 77.5 L19.5 79 L18 83 L16.5 79 L12 77.5 L16.5 76 Z" fill="white" fillOpacity="0.6" />

            <defs>
                <linearGradient id="logo-bg" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1a1a2e" />
                    <stop offset="1" stopColor="#16213e" />
                </linearGradient>
                <linearGradient id="scene-gradient" x1="32" y1="54" x2="32" y2="94" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f43f5e" />
                    <stop offset="1" stopColor="#e11d48" />
                </linearGradient>
                <linearGradient id="scene-gradient-2" x1="62" y1="58" x2="88" y2="94" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fb7185" />
                    <stop offset="1" stopColor="#f43f5e" />
                </linearGradient>
                <linearGradient id="sun-gradient" x1="63" y1="33" x2="81" y2="51" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fbbf24" />
                    <stop offset="1" stopColor="#f59e0b" />
                </linearGradient>
            </defs>
        </svg>
    );
}

export function LogoMark({ size = 36, className = '' }) {
    return (
        <div className={`inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <Logo size={size} />
        </div>
    );
}

export function LogoFull({ size = 36, className = '' }) {
    return (
        <div className={`inline-flex items-center gap-2.5 ${className}`}>
            <Logo size={size} />
            <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 leading-tight tracking-tight">Poster of the Day</span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Admin</span>
            </div>
        </div>
    );
}

export function LogoFullLight({ size = 36, className = '' }) {
    return (
        <div className={`inline-flex items-center gap-2.5 ${className}`}>
            <Logo size={size} />
            <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-tight tracking-tight">Poster of Day</span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Admin</span>
            </div>
        </div>
    );
}
