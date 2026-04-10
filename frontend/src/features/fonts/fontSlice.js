import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchFonts = createAsyncThunk('fonts/fetch', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get('/fonts');
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load fonts');
    }
});

export const createFont = createAsyncThunk('fonts/create', async (formData, { rejectWithValue }) => {
    try {
        const response = await axios.post('/fonts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to upload font');
    }
});

export const updateFont = createAsyncThunk('fonts/update', async ({ id, formData }, { rejectWithValue }) => {
    try {
        formData.append('_method', 'PUT');
        const response = await axios.post(`/fonts/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update font');
    }
});

export const deleteFont = createAsyncThunk('fonts/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/fonts/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete font');
    }
});

export const toggleFont = createAsyncThunk('fonts/toggle', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/fonts/${id}/toggle`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to toggle font');
    }
});

export const setDefaultFont = createAsyncThunk('fonts/setDefault', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/fonts/${id}/default`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to set default font');
    }
});

export const bulkActivateFonts = createAsyncThunk('fonts/bulkActivate', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/fonts/bulk-activate', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const bulkDeactivateFonts = createAsyncThunk('fonts/bulkDeactivate', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/fonts/bulk-deactivate', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const bulkDeleteFonts = createAsyncThunk('fonts/bulkDelete', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/fonts/bulk-delete', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const exportFonts = createAsyncThunk('fonts/export', async (ids, { rejectWithValue }) => {
    try {
        const r = await axios.post('/fonts/export', { ids }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fonts.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
    } catch (e) { return rejectWithValue('Export failed'); }
});

const fontSlice = createSlice({
    name: 'fonts',
    initialState: { items: [], loading: false, error: null },
    reducers: {
        clearFontError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFonts.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchFonts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchFonts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createFont.fulfilled, (state, action) => { state.items.push(action.payload); })
            .addCase(updateFont.fulfilled, (state, action) => {
                const idx = state.items.findIndex(f => f.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(deleteFont.fulfilled, (state, action) => {
                state.items = state.items.filter(f => f.id !== action.payload);
            })
            .addCase(toggleFont.fulfilled, (state, action) => {
                const idx = state.items.findIndex(f => f.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(setDefaultFont.fulfilled, (state, action) => {
                state.items = state.items.map(f => ({ ...f, is_default: f.id === action.payload.id }));
            });
    },
});

export const { clearFontError } = fontSlice.actions;
export default fontSlice.reducer;
