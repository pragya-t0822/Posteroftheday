import { useSelector } from 'react-redux';

export default function Header({ collapsed, onToggle, title }) {
    const { user } = useSelector((state) => state.auth);

    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dateStr = `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}`;

    return (
        <header className="sticky top-0 z-20 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-100">
            {/* Left: toggle + title + date */}
            <div className="flex items-center gap-4">
                <button onClick={onToggle} className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-base font-semibold text-gray-900 leading-tight">{title}</h1>
                    <p className="text-xs text-gray-400">{dateStr}</p>
                </div>
            </div>

            {/* Right: bell + user */}
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                </button>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.role?.name || 'User'}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                            {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
