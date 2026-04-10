import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchFollowUps = createAsyncThunk('followUps/fetch', async (params, { rejectWithValue }) => {
    try {
        const response = await axios.get('/follow-ups', { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load follow-ups');
    }
});

export const createFollowUp = createAsyncThunk('followUps/create', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/follow-ups', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create follow-up');
    }
});

export const updateFollowUp = createAsyncThunk('followUps/update', async ({ id, ...data }, { rejectWithValue }) => {
    try {
        const response = await axios.put(`/follow-ups/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update follow-up');
    }
});

export const deleteFollowUp = createAsyncThunk('followUps/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/follow-ups/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete follow-up');
    }
});

export const markFollowUpCompleted = createAsyncThunk('followUps/complete', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/follow-ups/${id}/complete`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to mark as completed');
    }
});

export const fetchUpcomingFollowUps = createAsyncThunk('followUps/upcoming', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get('/follow-ups-upcoming');
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load upcoming follow-ups');
    }
});

export const bulkDeleteFollowUps = createAsyncThunk('followUps/bulkDelete', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/follow-ups/bulk-delete', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const exportFollowUps = createAsyncThunk('followUps/export', async (ids, { rejectWithValue }) => {
    try {
        const r = await axios.post('/follow-ups/export', { ids }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'follow-ups.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
    } catch (e) { return rejectWithValue('Export failed'); }
});

const followUpSlice = createSlice({
    name: 'followUps',
    initialState: {
        items: [],
        upcoming: [],
        loading: false,
        error: null,
        pagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    },
    reducers: {
        clearFollowUpError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFollowUps.pending, (state) => { state.loading = true; })
            .addCase(fetchFollowUps.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    per_page: action.payload.per_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchFollowUps.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createFollowUp.rejected, (state, action) => { state.error = action.payload; })
            .addCase(updateFollowUp.rejected, (state, action) => { state.error = action.payload; })
            .addCase(deleteFollowUp.rejected, (state, action) => { state.error = action.payload; })
            .addCase(markFollowUpCompleted.fulfilled, (state, action) => {
                const idx = state.items.findIndex(f => f.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(markFollowUpCompleted.rejected, (state, action) => { state.error = action.payload; })
            .addCase(fetchUpcomingFollowUps.fulfilled, (state, action) => { state.upcoming = action.payload; });
    },
});

export const { clearFollowUpError } = followUpSlice.actions;
export default followUpSlice.reducer;
