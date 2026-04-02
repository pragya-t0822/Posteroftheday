import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchFrameRequests = createAsyncThunk('frameRequests/fetch', async (params, { rejectWithValue }) => {
    try {
        const response = await axios.get('/frame-requests', { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load frame requests');
    }
});

export const fetchFrameRequestDetail = createAsyncThunk('frameRequests/fetchDetail', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.get(`/frame-requests/${id}`);
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load frame request');
    }
});

export const updateFrameRequest = createAsyncThunk('frameRequests/update', async ({ id, formData }, { rejectWithValue }) => {
    try {
        formData.append('_method', 'PUT');
        const response = await axios.post(`/frame-requests/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update frame request');
    }
});

export const deleteFrameRequest = createAsyncThunk('frameRequests/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/frame-requests/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete frame request');
    }
});

const frameRequestSlice = createSlice({
    name: 'frameRequests',
    initialState: {
        items: [],
        loading: false,
        error: null,
        pagination: { current_page: 1, last_page: 1, per_page: 10, total: 0 },
    },
    reducers: {
        clearFrameRequestError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFrameRequests.pending, (state) => { state.loading = true; })
            .addCase(fetchFrameRequests.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    per_page: action.payload.per_page,
                    total: action.payload.total,
                };
            })
            .addCase(fetchFrameRequests.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(updateFrameRequest.fulfilled, (state) => { state.error = null; })
            .addCase(updateFrameRequest.rejected, (state, action) => { state.error = action.payload; })
            .addCase(deleteFrameRequest.fulfilled, (state) => { state.error = null; })
            .addCase(deleteFrameRequest.rejected, (state, action) => { state.error = action.payload; });
    },
});

export const { clearFrameRequestError } = frameRequestSlice.actions;
export default frameRequestSlice.reducer;
