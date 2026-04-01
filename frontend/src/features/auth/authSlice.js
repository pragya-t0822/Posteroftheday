import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await axios.post('/login', credentials);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('permissions', JSON.stringify(response.data.permissions));
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.response?.data?.errors?.email?.[0] || 'Login failed'
            );
        }
    }
);

export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axios.post('/register', userData);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('permissions', JSON.stringify(response.data.permissions));
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || 'Registration failed'
            );
        }
    }
);

export const fetchUser = createAsyncThunk(
    'auth/fetchUser',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/user');
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('permissions', JSON.stringify(response.data.permissions));
            return response.data;
        } catch (error) {
            return rejectWithValue('Session expired');
        }
    }
);

export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await axios.post('/logout');
        } catch (error) {
            // ignore
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('permissions');
        }
    }
);

const storedUser = localStorage.getItem('user');
const storedPermissions = localStorage.getItem('permissions');

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: storedUser ? JSON.parse(storedUser) : null,
        token: localStorage.getItem('token') || null,
        permissions: storedPermissions ? JSON.parse(storedPermissions) : [],
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.permissions = action.payload.permissions;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.permissions = action.payload.permissions;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.permissions = action.payload.permissions;
            })
            .addCase(fetchUser.rejected, (state) => {
                state.user = null;
                state.token = null;
                state.permissions = [];
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.permissions = [];
            });
    },
});

export const { clearError } = authSlice.actions;
export const selectHasPermission = (state, slug) => state.auth.permissions.includes(slug);
export default authSlice.reducer;
