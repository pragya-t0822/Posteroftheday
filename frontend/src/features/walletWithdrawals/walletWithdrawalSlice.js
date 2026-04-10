import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchWithdrawals = createAsyncThunk('walletWithdrawals/fetch', async (params, { rejectWithValue }) => {
    try {
        const response = await axios.get('/wallet-withdrawals', { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load withdrawal requests');
    }
});

export const createWithdrawal = createAsyncThunk('walletWithdrawals/create', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/wallet-withdrawals', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to submit withdrawal request');
    }
});

export const approveWithdrawal = createAsyncThunk('walletWithdrawals/approve', async ({ id, admin_remarks }, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/wallet-withdrawals/${id}/approve`, { admin_remarks });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to approve withdrawal');
    }
});

export const rejectWithdrawal = createAsyncThunk('walletWithdrawals/reject', async ({ id, admin_remarks }, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/wallet-withdrawals/${id}/reject`, { admin_remarks });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to reject withdrawal');
    }
});

export const deleteWithdrawal = createAsyncThunk('walletWithdrawals/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/wallet-withdrawals/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete withdrawal');
    }
});

export const bulkDeleteWithdrawals = createAsyncThunk('walletWithdrawals/bulkDelete', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/wallet-withdrawals/bulk-delete', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const exportWithdrawals = createAsyncThunk('walletWithdrawals/export', async (ids, { rejectWithValue }) => {
    try {
        const r = await axios.post('/wallet-withdrawals/export', { ids }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wallet-withdrawals.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
    } catch (e) { return rejectWithValue('Export failed'); }
});

const walletWithdrawalSlice = createSlice({
    name: 'walletWithdrawals',
    initialState: {
        items: [],
        loading: false,
        error: null,
        pagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    },
    reducers: {
        clearWithdrawalError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWithdrawals.pending, (state) => { state.loading = true; })
            .addCase(fetchWithdrawals.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    per_page: action.payload.per_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchWithdrawals.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createWithdrawal.rejected, (state, action) => { state.error = action.payload; })
            .addCase(approveWithdrawal.fulfilled, (state, action) => {
                const idx = state.items.findIndex(w => w.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(approveWithdrawal.rejected, (state, action) => { state.error = action.payload; })
            .addCase(rejectWithdrawal.fulfilled, (state, action) => {
                const idx = state.items.findIndex(w => w.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(rejectWithdrawal.rejected, (state, action) => { state.error = action.payload; })
            .addCase(deleteWithdrawal.fulfilled, (state, action) => {
                state.items = state.items.filter(w => w.id !== action.payload);
            })
            .addCase(deleteWithdrawal.rejected, (state, action) => { state.error = action.payload; });
    },
});

export const { clearWithdrawalError } = walletWithdrawalSlice.actions;
export default walletWithdrawalSlice.reducer;
