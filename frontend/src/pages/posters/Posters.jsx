export default function Posters() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Posters</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your poster collection.</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                </div>
                <p className="text-sm text-gray-500">Poster management module coming soon.</p>
            </div>
        </div>
    );
}
