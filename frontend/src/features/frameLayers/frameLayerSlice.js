import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchFrameLayers = createAsyncThunk('frameLayers/fetch', async (params = {}, { rejectWithValue }) => {
    try {
        const response = await axios.get('/frame-layers', { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load frame layers');
    }
});

export const createFrameLayer = createAsyncThunk('frameLayers/create', async (formData, { rejectWithValue }) => {
    try {
        const response = await axios.post('/frame-layers', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create frame layer');
    }
});

export const updateFrameLayer = createAsyncThunk('frameLayers/update', async ({ id, formData }, { rejectWithValue }) => {
    try {
        formData.append('_method', 'PUT');
        const response = await axios.post(`/frame-layers/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update frame layer');
    }
});

export const deleteFrameLayer = createAsyncThunk('frameLayers/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/frame-layers/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete frame layer');
    }
});

export const toggleFrameLayer = createAsyncThunk('frameLayers/toggle', async (id, { rejectWithValue }) => {
    try {
        const response = await axios.patch(`/frame-layers/${id}/toggle`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to toggle frame layer');
    }
});

const frameLayerSlice = createSlice({
    name: 'frameLayers',
    initialState: {
        items: [],
        pagination: { current_page: 1, last_page: 1, total: 0, per_page: 12 },
        loading: false,
        error: null,
    },
    reducers: {
        clearFrameLayerError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchFrameLayers.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchFrameLayers.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload.data;
                state.pagination = {
                    current_page: action.payload.current_page,
                    last_page: action.payload.last_page,
                    total: action.payload.total,
                    per_page: action.payload.per_page,
                };
            })
            .addCase(fetchFrameLayers.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(createFrameLayer.rejected, (state, action) => { state.error = action.payload; })
            .addCase(updateFrameLayer.rejected, (state, action) => { state.error = action.payload; })
            .addCase(deleteFrameLayer.rejected, (state, action) => { state.error = action.payload; })
            .addCase(toggleFrameLayer.fulfilled, (state, action) => {
                const idx = state.items.findIndex(f => f.id === action.payload.id);
                if (idx !== -1) state.items[idx] = action.payload;
            });
    },
});

export const { clearFrameLayerError } = frameLayerSlice.actions;
export default frameLayerSlice.reducer;
