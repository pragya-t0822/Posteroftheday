import { useLocation } from 'react-router-dom';
import Logo from '../../components/Logo';
import Footer from '../../components/Footer';

const APP_STORE_URL = 'https://apps.apple.com/app/poster-of-the-day';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.posteroftheday';

export default function DownloadApp() {
    const location = useLocation();
    const isFree = location.state?.free;
    const isPaid = location.state?.paid;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
            {/* Header */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-center">
                    <div className="flex items-center gap-2.5">
                        <Logo size={30} />
                        <span className="text-sm font-bold text-gray-900">Poster of the Day</span>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-lg text-center">
                    {/* Success animation */}
                    <div className="relative inline-flex items-center justify-center mb-8">
                        <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-emerald-100 animate-ping opacity-20" />
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                    </div>

                    {/* Success message */}
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Registration Successful!
                    </h1>
                    <p className="text-gray-500 mt-3 text-base max-w-md mx-auto leading-relaxed">
                        {isPaid
                            ? 'Your premium subscription is now active. Download our mobile app to start creating stunning posters!'
                            : 'Your account is ready. Download the Poster of the Day app to start designing beautiful posters right from your phone!'}
                    </p>

                    {/* Features */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-8 shadow-sm text-left">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                            {isPaid ? 'Premium Access Unlocked' : 'What You Get'}
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { text: 'Daily fresh poster designs', icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z' },
                                { text: 'Festival & event reminders', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
                                { text: 'Custom branding & logo', icon: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42' },
                                { text: isPaid ? 'HD & 4K downloads' : 'Standard quality posters', icon: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3' },
                            ].map(({ text, icon }, i) => (
                                <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50">
                                    <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                                    </svg>
                                    <span className="text-xs text-gray-600 leading-snug">{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Download Section */}
                    <div className="mt-8">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Download the App</p>

                        <div className="flex items-center justify-center gap-4">
                            {/* App Store Button */}
                            <a
                                href={APP_STORE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20 hover:-translate-y-0.5 transition-all"
                            >
                                <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.82 11.78 5.7 12.57 5.7C13.36 5.7 14.85 4.63 16.4 4.81C17.05 4.83 18.89 5.09 20.06 6.82C19.96 6.88 17.62 8.23 17.64 11.11C17.67 14.57 20.62 15.72 20.65 15.73C20.63 15.79 20.18 17.33 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                                </svg>
                                <div className="text-left">
                                    <p className="text-[10px] text-white/60 leading-none">Download on the</p>
                                    <p className="text-sm font-bold leading-tight mt-0.5">App Store</p>
                                </div>
                            </a>

                            {/* Google Play Button */}
                            <a
                                href={PLAY_STORE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-3 px-5 py-3 rounded-2xl bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20 hover:-translate-y-0.5 transition-all"
                            >
                                <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.18 23.04C2.56 22.72 2.15 22.08 2.15 21.35V2.65C2.15 1.92 2.56 1.28 3.18 0.96L13.24 12L3.18 23.04ZM15.67 14.44L5.26 20.46L13.82 12.58L15.67 14.44ZM20.16 10.81C20.68 11.12 21 11.64 21 12.21C21 12.78 20.68 13.3 20.16 13.61L17.89 14.92L15.89 12.58L17.89 10.24L20.16 10.81ZM5.26 3.54L15.67 9.56L13.82 11.42L5.26 3.54Z" />
                                </svg>
                                <div className="text-left">
                                    <p className="text-[10px] text-white/60 leading-none">Get it on</p>
                                    <p className="text-sm font-bold leading-tight mt-0.5">Google Play</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="mt-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm inline-block">
                        <p className="text-xs font-medium text-gray-500 mb-3">Scan to download</p>
                        {/* QR Code placeholder - generates a simple visual QR pattern */}
                        <div className="w-32 h-32 mx-auto bg-white border-2 border-gray-200 rounded-xl p-2 flex items-center justify-center">
                            <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
                                {/* QR-like pattern */}
                                <rect width="100" height="100" fill="white"/>
                                {/* Corner markers */}
                                <rect x="4" y="4" width="24" height="24" rx="2" fill="#111827"/>
                                <rect x="8" y="8" width="16" height="16" rx="1" fill="white"/>
                                <rect x="11" y="11" width="10" height="10" rx="1" fill="#111827"/>
                                <rect x="72" y="4" width="24" height="24" rx="2" fill="#111827"/>
                                <rect x="76" y="8" width="16" height="16" rx="1" fill="white"/>
                                <rect x="79" y="11" width="10" height="10" rx="1" fill="#111827"/>
                                <rect x="4" y="72" width="24" height="24" rx="2" fill="#111827"/>
                                <rect x="8" y="76" width="16" height="16" rx="1" fill="white"/>
                                <rect x="11" y="79" width="10" height="10" rx="1" fill="#111827"/>
                                {/* Data pattern */}
                                <rect x="36" y="4" width="6" height="6" fill="#111827"/>
                                <rect x="48" y="4" width="6" height="6" fill="#111827"/>
                                <rect x="60" y="4" width="6" height="6" fill="#111827"/>
                                <rect x="36" y="16" width="6" height="6" fill="#111827"/>
                                <rect x="48" y="16" width="6" height="6" fill="#111827"/>
                                <rect x="4" y="36" width="6" height="6" fill="#111827"/>
                                <rect x="16" y="36" width="6" height="6" fill="#111827"/>
                                <rect x="4" y="48" width="6" height="6" fill="#111827"/>
                                <rect x="16" y="48" width="6" height="6" fill="#111827"/>
                                <rect x="4" y="60" width="6" height="6" fill="#111827"/>
                                <rect x="36" y="36" width="6" height="6" fill="#f43f5e"/>
                                <rect x="48" y="36" width="6" height="6" fill="#f43f5e"/>
                                <rect x="60" y="36" width="6" height="6" fill="#f43f5e"/>
                                <rect x="36" y="48" width="6" height="6" fill="#f43f5e"/>
                                <rect x="48" y="48" width="6" height="6" fill="#111827"/>
                                <rect x="60" y="48" width="6" height="6" fill="#f43f5e"/>
                                <rect x="36" y="60" width="6" height="6" fill="#f43f5e"/>
                                <rect x="48" y="60" width="6" height="6" fill="#f43f5e"/>
                                <rect x="60" y="60" width="6" height="6" fill="#f43f5e"/>
                                <rect x="72" y="36" width="6" height="6" fill="#111827"/>
                                <rect x="84" y="36" width="6" height="6" fill="#111827"/>
                                <rect x="72" y="48" width="6" height="6" fill="#111827"/>
                                <rect x="84" y="48" width="6" height="6" fill="#111827"/>
                                <rect x="72" y="60" width="6" height="6" fill="#111827"/>
                                <rect x="84" y="60" width="6" height="6" fill="#111827"/>
                                <rect x="36" y="72" width="6" height="6" fill="#111827"/>
                                <rect x="48" y="72" width="6" height="6" fill="#111827"/>
                                <rect x="60" y="72" width="6" height="6" fill="#111827"/>
                                <rect x="72" y="72" width="6" height="6" fill="#111827"/>
                                <rect x="84" y="72" width="6" height="6" fill="#111827"/>
                                <rect x="36" y="84" width="6" height="6" fill="#111827"/>
                                <rect x="60" y="84" width="6" height="6" fill="#111827"/>
                                <rect x="72" y="84" width="6" height="6" fill="#111827"/>
                                <rect x="84" y="84" width="6" height="6" fill="#111827"/>
                                <rect x="90" y="90" width="6" height="6" rx="1" fill="#111827"/>
                            </svg>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-2">Point your camera to download instantly</p>
                    </div>

                    {/* Subtle CTA */}
                    <p className="text-xs text-gray-400 mt-8">
                        Need help? Contact us at{' '}
                        <a href="mailto:support@posteroftheday.com" className="text-rose-500 hover:text-rose-600 font-medium transition-colors">
                            support@posteroftheday.com
                        </a>
                    </p>
                </div>
            </div>

            <Footer className="border-t border-gray-100 bg-white" />
        </div>
    );
}
