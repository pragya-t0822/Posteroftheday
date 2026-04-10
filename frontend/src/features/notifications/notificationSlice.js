import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (params, { rejectWithValue }) => {
    try {
        const response = await axios.get('/notifications', { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load notifications');
    }
});

export const createNotification = createAsyncThunk('notifications/create', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/notifications', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create notification');
    }
});

export const updateNotification = createAsyncThunk('notifications/update', async ({ id, ...data }, { rejectWithValue }) => {
    try {
        const response = await axios.put(`/notifications/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update notification');
    }
});

export const deleteNotification = createAsyncThunk('notifications/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/notifications/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete notification');
    }
});

export const sendNotification = createAsyncThunk('notifications/send', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/notifications/${id}/send`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to send notification');
    }
});

export const bulkDeleteNotifications = createAsyncThunk('notifications/bulkDelete', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/notifications/bulk-delete', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const exportNotifications = createAsyncThunk('notifications/export', async (ids, { rejectWithValue }) => {
    try {
        const r = await axios.post('/notifications/export', { ids }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notifications.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
    } catch (e) { return rejectWithValue('Export failed'); }
});

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        items: [],
        loading: false,
        error: null,
        pagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    },
    reducers: {
        clearNotificationError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    per_page: action.payload.per_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchNotifications.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createNotification.rejected, (state, action) => { state.error = action.payload; })
            .addCase(updateNotification.rejected, (state, action) => { state.error = action.payload; })
            .addCase(deleteNotification.rejected, (state, action) => { state.error = action.payload; })
            .addCase(sendNotification.fulfilled, (state, action) => {
                const notification = action.payload.notification || action.payload;
                const idx = state.items.findIndex(n => n.id === notification.id);
                if (idx !== -1) state.items[idx] = notification;
            })
            .addCase(sendNotification.rejected, (state, action) => { state.error = action.payload; });
    },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
