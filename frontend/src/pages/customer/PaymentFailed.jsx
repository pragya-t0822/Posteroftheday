import { Link } from 'react-router-dom';
import Footer from '../../components/Footer';

export default function PaymentFailed() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6">
                    <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
                <p className="text-gray-500 mb-8">
                    Something went wrong with your payment. Don't worry — no money was deducted. You can try again.
                </p>
                <div className="flex gap-3">
                    <Link to="/get-started" className="flex-1 py-3 rounded-xl bg-gray-900 text-white text-sm font-semibold text-center hover:bg-gray-800 transition-colors">
                        Try Again
                    </Link>
                    <Link to="/customer/login" className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-center text-gray-700 hover:bg-gray-50 transition-colors">
                        Go to Login
                    </Link>
                </div>
            </div>
            </div>
            <Footer className="border-t border-gray-100 bg-white" />
        </div>
    );
}
