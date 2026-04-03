import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function CustomerProtectedRoute({ children }) {
    const { token, user } = useSelector((state) => state.auth);

    if (!token) {
        return <Navigate to="/customer/login" replace />;
    }

    // Block non-customers from customer area
    if (user?.role?.slug !== 'customer') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
