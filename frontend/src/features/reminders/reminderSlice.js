import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchReminders = createAsyncThunk('reminders/fetch', async (params, { rejectWithValue }) => {
    try {
        const response = await axios.get('/reminders', { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load reminders');
    }
});

export const createReminder = createAsyncThunk('reminders/create', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/reminders', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create reminder');
    }
});

export const updateReminder = createAsyncThunk('reminders/update', async ({ id, ...data }, { rejectWithValue }) => {
    try {
        const response = await axios.put(`/reminders/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update reminder');
    }
});

export const deleteReminder = createAsyncThunk('reminders/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/reminders/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete reminder');
    }
});

export const toggleReminder = createAsyncThunk('reminders/toggle', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/reminders/${id}/toggle`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to toggle reminder');
    }
});

export const bulkActivateReminders = createAsyncThunk('reminders/bulkActivate', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/reminders/bulk-activate', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const bulkDeactivateReminders = createAsyncThunk('reminders/bulkDeactivate', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/reminders/bulk-deactivate', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const bulkDeleteReminders = createAsyncThunk('reminders/bulkDelete', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/reminders/bulk-delete', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const exportReminders = createAsyncThunk('reminders/export', async (ids, { rejectWithValue }) => {
    try {
        const r = await axios.post('/reminders/export', { ids }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reminders.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
    } catch (e) { return rejectWithValue('Export failed'); }
});

const reminderSlice = createSlice({
    name: 'reminders',
    initialState: {
        items: [],
        loading: false,
        error: null,
        pagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    },
    reducers: {
        clearReminderError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReminders.pending, (state) => { state.loading = true; })
            .addCase(fetchReminders.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    per_page: action.payload.per_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchReminders.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createReminder.fulfilled, (state) => { state.error = null; })
            .addCase(createReminder.rejected, (state, action) => { state.error = action.payload; })
            .addCase(updateReminder.fulfilled, (state) => { state.error = null; })
            .addCase(updateReminder.rejected, (state, action) => { state.error = action.payload; })
            .addCase(deleteReminder.fulfilled, (state) => { state.error = null; })
            .addCase(deleteReminder.rejected, (state, action) => { state.error = action.payload; })
            .addCase(toggleReminder.fulfilled, (state, action) => {
                const idx = state.items.findIndex(r => r.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(toggleReminder.rejected, (state, action) => { state.error = action.payload; });
    },
});

export const { clearReminderError } = reminderSlice.actions;
export default reminderSlice.reducer;
