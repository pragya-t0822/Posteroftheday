import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchUsers = createAsyncThunk('users/fetch', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get('/users');
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load users');
    }
});

export const createUser = createAsyncThunk('users/create', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/users', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
});

export const updateUser = createAsyncThunk('users/update', async ({ id, ...data }, { rejectWithValue }) => {
    try {
        const response = await axios.put(`/users/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
});

export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/users/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
});

export const bulkActivateUsers = createAsyncThunk('users/bulkActivate', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/users/bulk-activate', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const bulkDeactivateUsers = createAsyncThunk('users/bulkDeactivate', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/users/bulk-deactivate', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const bulkDeleteUsers = createAsyncThunk('users/bulkDelete', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/users/bulk-delete', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const exportUsers = createAsyncThunk('users/export', async (ids, { rejectWithValue }) => {
    try {
        const r = await axios.post('/users/export', { ids }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
    } catch (e) { return rejectWithValue('Export failed'); }
});

const userSlice = createSlice({
    name: 'users',
    initialState: { items: [], loading: false, error: null },
    reducers: {
        clearUserError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => { state.loading = true; })
            .addCase(fetchUsers.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchUsers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createUser.fulfilled, (state, action) => { state.items.push(action.payload); })
            .addCase(updateUser.fulfilled, (state, action) => {
                const idx = state.items.findIndex(u => u.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.items = state.items.filter(u => u.id !== action.payload);
            });
    },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;
