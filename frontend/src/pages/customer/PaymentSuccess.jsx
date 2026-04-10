import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to download app page after successful payment
        navigate('/download-app', { state: { paid: true }, replace: true });
    }, [navigate]);

    // Brief loading state while redirecting
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                    <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                <p className="text-sm text-gray-500">Payment successful. Redirecting...</p>
            </div>
        </div>
    );
}
