import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchPermissions = createAsyncThunk('permissions/fetch', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get('/permissions');
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load permissions');
    }
});

export const createPermission = createAsyncThunk('permissions/create', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/permissions', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create permission');
    }
});

export const updatePermission = createAsyncThunk('permissions/update', async ({ id, ...data }, { rejectWithValue }) => {
    try {
        const response = await axios.put(`/permissions/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update permission');
    }
});

export const deletePermission = createAsyncThunk('permissions/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/permissions/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete permission');
    }
});

const permissionSlice = createSlice({
    name: 'permissions',
    initialState: { items: [], loading: false, error: null },
    reducers: {
        clearPermissionError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPermissions.pending, (state) => { state.loading = true; })
            .addCase(fetchPermissions.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchPermissions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createPermission.fulfilled, (state, action) => { state.items.push(action.payload); })
            .addCase(updatePermission.fulfilled, (state, action) => {
                const idx = state.items.findIndex(p => p.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(deletePermission.fulfilled, (state, action) => {
                state.items = state.items.filter(p => p.id !== action.payload);
            });
    },
});

export const { clearPermissionError } = permissionSlice.actions;
export default permissionSlice.reducer;
