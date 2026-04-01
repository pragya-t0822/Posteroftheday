import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPaymentOrder, verifyPayment, reportPaymentFailed } from '../../features/customer/customerSlice';
import Footer from '../../components/Footer';

export default function PaymentCheckout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const subscription = location.state?.subscription;
    const { orderData, loading, error } = useSelector((state) => state.customer);

    useEffect(() => {
        if (subscription?.id) {
            dispatch(createPaymentOrder(subscription.id));
        }
    }, [dispatch, subscription]);

    useEffect(() => {
        if (!orderData) return;

        const options = {
            key: orderData.key_id,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'Poster of the Day',
            description: orderData.package_name,
            order_id: orderData.order_id,
            prefill: {
                name: orderData.user.name,
                email: orderData.user.email,
            },
            theme: { color: '#f43f5e' },
            handler: async (response) => {
                const result = await dispatch(verifyPayment({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                }));
                if (verifyPayment.fulfilled.match(result)) {
                    navigate('/payment/success');
                } else {
                    navigate('/payment/failed');
                }
            },
            modal: {
                ondismiss: () => {
                    dispatch(reportPaymentFailed({
                        razorpay_order_id: orderData.order_id,
                        error_description: 'Payment dismissed by user',
                    }));
                    navigate('/payment/failed');
                },
            },
        };

        if (window.Razorpay) {
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                dispatch(reportPaymentFailed({
                    razorpay_order_id: orderData.order_id,
                    error_description: response.error?.description,
                }));
                navigate('/payment/failed');
            });
            rzp.open();
        }
    }, [orderData, dispatch, navigate]);

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 mb-6">
                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {loading ? 'Preparing payment...' : 'Opening Razorpay...'}
                </h2>
                <p className="text-sm text-gray-500">
                    {subscription?.package?.name} — ₹{subscription?.package?.price}
                </p>
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>
            </div>
            <Footer className="border-t border-gray-100 bg-white" />
        </div>
    );
}
