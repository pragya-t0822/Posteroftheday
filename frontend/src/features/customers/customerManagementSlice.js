import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchCustomers = createAsyncThunk('customerManagement/fetch', async (params, { rejectWithValue }) => {
    try {
        const response = await axios.get('/customers', { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load customers');
    }
});

export const createCustomer = createAsyncThunk('customerManagement/create', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/customers', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create customer');
    }
});

export const updateCustomer = createAsyncThunk('customerManagement/update', async ({ id, ...data }, { rejectWithValue }) => {
    try {
        const response = await axios.put(`/customers/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update customer');
    }
});

export const fetchCustomerDetail = createAsyncThunk('customerManagement/fetchDetail', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.get(`/customers/${id}`);
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load customer details');
    }
});

export const deleteCustomer = createAsyncThunk('customerManagement/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/customers/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete customer');
    }
});

const customerManagementSlice = createSlice({
    name: 'customerManagement',
    initialState: {
        items: [],
        detail: null,
        detailLoading: false,
        loading: false,
        error: null,
        pagination: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
        },
    },
    reducers: {
        clearCustomerManagementError: (state) => { state.error = null; },
        clearCustomerDetail: (state) => { state.detail = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCustomerDetail.pending, (state) => { state.detailLoading = true; state.error = null; })
            .addCase(fetchCustomerDetail.fulfilled, (state, action) => { state.detailLoading = false; state.detail = action.payload; })
            .addCase(fetchCustomerDetail.rejected, (state, action) => { state.detailLoading = false; state.error = action.payload; })
            .addCase(fetchCustomers.pending, (state) => { state.loading = true; })
            .addCase(fetchCustomers.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    per_page: action.payload.per_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchCustomers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createCustomer.fulfilled, (state) => { state.error = null; })
            .addCase(createCustomer.rejected, (state, action) => { state.error = action.payload; })
            .addCase(updateCustomer.fulfilled, (state) => { state.error = null; })
            .addCase(updateCustomer.rejected, (state, action) => { state.error = action.payload; })
            .addCase(deleteCustomer.fulfilled, (state) => { state.error = null; })
            .addCase(deleteCustomer.rejected, (state, action) => { state.error = action.payload; });
    },
});

export const { clearCustomerManagementError, clearCustomerDetail } = customerManagementSlice.actions;
export default customerManagementSlice.reducer;
