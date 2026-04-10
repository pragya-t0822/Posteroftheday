import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchRoles = createAsyncThunk('roles/fetch', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get('/roles');
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load roles');
    }
});

export const createRole = createAsyncThunk('roles/create', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/roles', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create role');
    }
});

export const updateRole = createAsyncThunk('roles/update', async ({ id, ...data }, { rejectWithValue }) => {
    try {
        const response = await axios.put(`/roles/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update role');
    }
});

export const deleteRole = createAsyncThunk('roles/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/roles/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete role');
    }
});

export const assignPermissions = createAsyncThunk('roles/assignPermissions', async ({ roleId, permissions }, { rejectWithValue }) => {
    try {
        const response = await axios.post(`/roles/${roleId}/permissions`, { permissions });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to assign permissions');
    }
});

export const bulkDeleteRoles = createAsyncThunk('roles/bulkDelete', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/roles/bulk-delete', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const exportRoles = createAsyncThunk('roles/export', async (ids, { rejectWithValue }) => {
    try {
        const r = await axios.post('/roles/export', { ids }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'roles.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
    } catch (e) { return rejectWithValue('Export failed'); }
});

const roleSlice = createSlice({
    name: 'roles',
    initialState: { items: [], loading: false, error: null },
    reducers: {
        clearRoleError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoles.pending, (state) => { state.loading = true; })
            .addCase(fetchRoles.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchRoles.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createRole.fulfilled, (state, action) => { state.items.push(action.payload); })
            .addCase(updateRole.fulfilled, (state, action) => {
                const idx = state.items.findIndex(r => r.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(deleteRole.fulfilled, (state, action) => {
                state.items = state.items.filter(r => r.id !== action.payload);
            })
            .addCase(assignPermissions.fulfilled, (state, action) => {
                const idx = state.items.findIndex(r => r.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            });
    },
});

export const { clearRoleError } = roleSlice.actions;
export default roleSlice.reducer;
