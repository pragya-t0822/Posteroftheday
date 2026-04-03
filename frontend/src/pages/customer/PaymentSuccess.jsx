import { Link, useLocation } from 'react-router-dom';
import Footer from '../../components/Footer';

export default function PaymentSuccess() {
    const location = useLocation();
    const isFree = location.state?.free;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
                    <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {isFree ? 'Welcome aboard!' : 'Payment Successful!'}
                </h1>
                <p className="text-gray-500 mb-8">
                    {isFree
                        ? 'Your free account is ready. Enjoy exploring Poster of the Day!'
                        : 'Your premium subscription is now active. Enjoy full access on the mobile app!'}
                </p>

                {!isFree && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 text-left">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Premium Access</p>
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                Mobile app premium features unlocked
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                HD & 4K poster downloads
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                                No watermarks
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <Link to="/customer/login" className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold text-center hover:bg-gray-800 transition-colors">
                        Go to Login
                    </Link>
                </div>
            </div>
            </div>
            <Footer className="border-t border-gray-100 bg-white" />
        </div>
    );
}
