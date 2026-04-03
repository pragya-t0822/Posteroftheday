import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const user = localStorage.getItem('user');
            let redirectTo = '/login';
            if (user) {
                try {
                    const parsed = JSON.parse(user);
                    if (parsed?.role?.slug === 'customer') {
                        redirectTo = '/customer/login';
                    }
                } catch (e) {}
            }
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('permissions');
            window.location.href = redirectTo;
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
