import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchPackages = createAsyncThunk('subscriptions/fetch', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get('/packages');
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load packages');
    }
});

export const createPackage = createAsyncThunk('subscriptions/create', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/packages', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create package');
    }
});

export const updatePackage = createAsyncThunk('subscriptions/update', async ({ id, ...data }, { rejectWithValue }) => {
    try {
        const response = await axios.put(`/packages/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update package');
    }
});

export const deletePackage = createAsyncThunk('subscriptions/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/packages/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete package');
    }
});

export const togglePackage = createAsyncThunk('subscriptions/toggle', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/packages/${id}/toggle`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to toggle package');
    }
});

const subscriptionSlice = createSlice({
    name: 'subscriptions',
    initialState: { items: [], loading: false, error: null },
    reducers: {
        clearSubscriptionError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPackages.pending, (state) => { state.loading = true; })
            .addCase(fetchPackages.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
            .addCase(fetchPackages.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createPackage.fulfilled, (state, action) => { state.items.push(action.payload); })
            .addCase(updatePackage.fulfilled, (state, action) => {
                const idx = state.items.findIndex(p => p.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            })
            .addCase(deletePackage.fulfilled, (state, action) => {
                state.items = state.items.filter(p => p.id !== action.payload);
            })
            .addCase(togglePackage.fulfilled, (state, action) => {
                const idx = state.items.findIndex(p => p.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            });
    },
});

export const { clearSubscriptionError } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
