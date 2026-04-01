import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

// Uses the public axios (no token needed for these)
import axiosPublic from 'axios';
const publicApi = axiosPublic.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
});

export const fetchPublicPackages = createAsyncThunk('customer/fetchPackages', async (_, { rejectWithValue }) => {
    try {
        const response = await publicApi.get('/customer/packages');
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load packages');
    }
});

export const registerCustomer = createAsyncThunk('customer/register', async (data, { rejectWithValue }) => {
    try {
        const response = await publicApi.post('/customer/register', data);
        // Store token for payment step
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('permissions', JSON.stringify(response.data.permissions));
        return response.data;
    } catch (error) {
        const msg = error.response?.data?.message
            || error.response?.data?.errors?.email?.[0]
            || 'Registration failed';
        return rejectWithValue(msg);
    }
});

export const createPaymentOrder = createAsyncThunk('customer/createOrder', async (subscriptionId, { rejectWithValue }) => {
    try {
        const response = await axios.post('/payment/create-order', { subscription_id: subscriptionId });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
});

export const verifyPayment = createAsyncThunk('customer/verifyPayment', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/payment/verify', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Verification failed');
    }
});

export const reportPaymentFailed = createAsyncThunk('customer/paymentFailed', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/payment/failed', data);
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to report payment failure');
    }
});

const customerSlice = createSlice({
    name: 'customer',
    initialState: {
        packages: [],
        selectedPackage: null,
        registrationData: null,
        orderData: null,
        paymentStatus: null, // null | 'processing' | 'success' | 'failed'
        loading: false,
        error: null,
    },
    reducers: {
        setSelectedPackage: (state, action) => { state.selectedPackage = action.payload; },
        clearCustomerError: (state) => { state.error = null; },
        resetCustomerFlow: (state) => {
            state.selectedPackage = null;
            state.registrationData = null;
            state.orderData = null;
            state.paymentStatus = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPublicPackages.fulfilled, (state, action) => { state.packages = action.payload; })
            .addCase(registerCustomer.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(registerCustomer.fulfilled, (state, action) => {
                state.loading = false;
                state.registrationData = action.payload;
            })
            .addCase(registerCustomer.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createPaymentOrder.pending, (state) => { state.loading = true; })
            .addCase(createPaymentOrder.fulfilled, (state, action) => { state.loading = false; state.orderData = action.payload; })
            .addCase(createPaymentOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(verifyPayment.pending, (state) => { state.paymentStatus = 'processing'; })
            .addCase(verifyPayment.fulfilled, (state) => { state.paymentStatus = 'success'; })
            .addCase(verifyPayment.rejected, (state) => { state.paymentStatus = 'failed'; })
            .addCase(reportPaymentFailed.fulfilled, (state) => { state.paymentStatus = 'failed'; });
    },
});

export const { setSelectedPackage, clearCustomerError, resetCustomerFlow } = customerSlice.actions;
export default customerSlice.reducer;
