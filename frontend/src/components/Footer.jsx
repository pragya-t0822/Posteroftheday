export default function Footer({ className = '' }) {
    return (
        <footer className={`py-3 text-center text-xs text-gray-400 ${className}`}>
            Developed by Innover Infotech &middot;{' '}
            <a
                href="https://www.innoverinfotech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-rose-500 hover:text-rose-600 font-medium transition-colors"
            >
                Innover Infotech Pvt. Ltd.
            </a>
        </footer>
    );
}
