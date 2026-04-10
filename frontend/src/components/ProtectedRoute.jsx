import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, permission }) {
    const { token, permissions, user } = useSelector((state) => state.auth);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // Block customers from admin panel entirely
    if (user?.role?.slug === 'customer') {
        return <Navigate to="/get-started" replace />;
    }

    if (permission && !permissions.includes(permission)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
