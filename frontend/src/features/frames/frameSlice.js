import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchFrames = createAsyncThunk('frames/fetch', async (params = {}, { rejectWithValue }) => {
    try {
        const response = await axios.get('/frames', { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load frames');
    }
});

export const createFrame = createAsyncThunk('frames/create', async (formData, { rejectWithValue }) => {
    try {
        const response = await axios.post('/frames', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create frame');
    }
});

export const updateFrame = createAsyncThunk('frames/update', async ({ id, formData }, { rejectWithValue }) => {
    try {
        formData.append('_method', 'PUT');
        const response = await axios.post(`/frames/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update frame');
    }
});

export const deleteFrame = createAsyncThunk('frames/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/frames/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete frame');
    }
});

export const toggleFrame = createAsyncThunk('frames/toggle', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/frames/${id}/toggle`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to toggle frame');
    }
});

export const bulkActivateFrames = createAsyncThunk('frames/bulkActivate', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/frames/bulk-activate', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const bulkDeactivateFrames = createAsyncThunk('frames/bulkDeactivate', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/frames/bulk-deactivate', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const bulkDeleteFrames = createAsyncThunk('frames/bulkDelete', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/frames/bulk-delete', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const exportFrames = createAsyncThunk('frames/export', async (ids, { rejectWithValue }) => {
    try {
        const r = await axios.post('/frames/export', { ids }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'frames.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
    } catch (e) { return rejectWithValue('Export failed'); }
});

const frameSlice = createSlice({
    name: 'frames',
    initialState: {
        items: [],
        pagination: { current_page: 1, last_page: 1, total: 0, per_page: 12 },
        loading: false,
        error: null,
    },
    reducers: {
        clearFrameError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFrames.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchFrames.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    total: action.payload.total,
                    per_page: action.payload.per_page,
                };
            })
            .addCase(fetchFrames.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createFrame.rejected, (state, action) => { state.error = action.payload; })
            .addCase(updateFrame.rejected, (state, action) => { state.error = action.payload; })
            .addCase(deleteFrame.rejected, (state, action) => { state.error = action.payload; })
            .addCase(toggleFrame.fulfilled, (state, action) => {
                const idx = state.items.findIndex(f => f.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            });
    },
});

export const { clearFrameError } = frameSlice.actions;
export default frameSlice.reducer;
