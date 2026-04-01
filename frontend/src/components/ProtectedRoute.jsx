import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, permission }) {
    const { token, permissions } = useSelector((state) => state.auth);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (permission && !permissions.includes(permission)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
