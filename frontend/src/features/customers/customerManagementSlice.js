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

export const toggleCustomerStatus = createAsyncThunk('customerManagement/toggleStatus', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/customers/${id}/toggle-status`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to toggle customer status');
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

export const fetchCustomerReferrals = createAsyncThunk('customerManagement/fetchReferrals', async ({ id, ...params }, { rejectWithValue }) => {
    try {
        const response = await axios.get(`/customers/${id}/referrals`, { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load referrals');
    }
});

export const updateReferralStatus = createAsyncThunk('customerManagement/updateReferralStatus', async ({ customerId, referralId, status }, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/customers/${customerId}/referrals/${referralId}/status`, { status });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update referral status');
    }
});

export const fetchCustomerFrameRequests = createAsyncThunk('customerManagement/fetchFrameRequests', async ({ id, ...params }, { rejectWithValue }) => {
    try {
        const response = await axios.get(`/customers/${id}/frame-requests`, { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load frame requests');
    }
});

export const bulkActivateCustomers = createAsyncThunk('customerManagement/bulkActivate', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/customers/bulk-activate', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const bulkDeactivateCustomers = createAsyncThunk('customerManagement/bulkDeactivate', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/customers/bulk-deactivate', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const bulkDeleteCustomers = createAsyncThunk('customerManagement/bulkDelete', async (ids, { rejectWithValue }) => {
    try { const r = await axios.post('/customers/bulk-delete', { ids }); return r.data; } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});
export const exportCustomers = createAsyncThunk('customerManagement/export', async (ids, { rejectWithValue }) => {
    try {
        const r = await axios.post('/customers/export', { ids }, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'customers.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return { success: true };
    } catch (e) { return rejectWithValue('Export failed'); }
});

const customerManagementSlice = createSlice({
    name: 'customerManagement',
    initialState: {
        items: [],
        detail: null,
        detailLoading: false,
        loading: false,
        error: null,
        referrals: [],
        referralsLoading: false,
        referralsPagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
        frameRequests: [],
        frameRequestsLoading: false,
        frameRequestsPagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
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
        clearCustomerReferrals: (state) => { state.referrals = []; state.referralsPagination = { current_page: 1, last_page: 1, per_page: 10, total: 0 }; },
        clearCustomerFrameRequests: (state) => { state.frameRequests = []; state.frameRequestsPagination = { current_page: 1, last_page: 1, per_page: 10, total: 0 }; },
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
            .addCase(toggleCustomerStatus.fulfilled, (state, action) => {
                state.error = null;
                const updated = action.payload;
                const idx = state.items.findIndex(c => c.id === updated.id);
                if (idx !== -1) state.items[idx] = updated;
            })
            .addCase(toggleCustomerStatus.rejected, (state, action) => { state.error = action.payload; })
            .addCase(deleteCustomer.fulfilled, (state) => { state.error = null; })
            .addCase(deleteCustomer.rejected, (state, action) => { state.error = action.payload; })
            .addCase(fetchCustomerReferrals.pending, (state) => { state.referralsLoading = true; })
            .addCase(fetchCustomerReferrals.fulfilled, (state, action) => {
                state.referralsLoading = false;
                state.referrals = action.payload.data;
                state.referralsPagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    per_page: action.payload.per_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchCustomerReferrals.rejected, (state, action) => { state.referralsLoading = false; state.error = action.payload; })
            .addCase(updateReferralStatus.fulfilled, (state) => { state.error = null; })
            .addCase(updateReferralStatus.rejected, (state, action) => { state.error = action.payload; })
            .addCase(fetchCustomerFrameRequests.pending, (state) => { state.frameRequestsLoading = true; })
            .addCase(fetchCustomerFrameRequests.fulfilled, (state, action) => {
                state.frameRequestsLoading = false;
                state.frameRequests = action.payload.data;
                state.frameRequestsPagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    per_page: action.payload.per_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchCustomerFrameRequests.rejected, (state, action) => { state.frameRequestsLoading = false; state.error = action.payload; });
    },
});

export const { clearCustomerManagementError, clearCustomerDetail, clearCustomerReferrals, clearCustomerFrameRequests } = customerManagementSlice.actions;
export default customerManagementSlice.reducer;
