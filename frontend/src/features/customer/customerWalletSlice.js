import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchWalletBalance = createAsyncThunk('customerWallet/fetchBalance', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get('/user');
        return { wallet_balance: response.data.wallet_balance };
    } catch (error) {
        return rejectWithValue('Failed to load wallet balance');
    }
});

export const fetchMyWithdrawals = createAsyncThunk('customerWallet/fetchHistory', async (params, { rejectWithValue }) => {
    try {
        const response = await axios.get('/my/wallet-withdrawals', { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load withdrawal history');
    }
});

export const submitWithdrawal = createAsyncThunk('customerWallet/submit', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/my/wallet-withdrawals', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to submit withdrawal request');
    }
});

const customerWalletSlice = createSlice({
    name: 'customerWallet',
    initialState: {
        balance: null,
        withdrawals: [],
        loading: false,
        submitting: false,
        error: null,
        pagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    },
    reducers: {
        clearWalletError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWalletBalance.fulfilled, (state, action) => {
                state.balance = parseFloat(action.payload.wallet_balance) || 0;
            })
            .addCase(fetchMyWithdrawals.pending, (state) => { state.loading = true; })
            .addCase(fetchMyWithdrawals.fulfilled, (state, action) => {
                state.loading = false;
                state.withdrawals = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    per_page: action.payload.per_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchMyWithdrawals.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(submitWithdrawal.pending, (state) => { state.submitting = true; state.error = null; })
            .addCase(submitWithdrawal.fulfilled, (state, action) => {
                state.submitting = false;
                state.withdrawals.unshift(action.payload);
                if (state.balance !== null) {
                    state.balance = Math.max(0, state.balance - parseFloat(action.payload.amount));
                }
            })
            .addCase(submitWithdrawal.rejected, (state, action) => { state.submitting = false; state.error = action.payload; });
    },
});

export const { clearWalletError } = customerWalletSlice.actions;
export default customerWalletSlice.reducer;
