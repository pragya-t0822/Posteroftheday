import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchSettings = createAsyncThunk('settings/fetch', async (group, { rejectWithValue }) => {
    try {
        const params = group ? { group } : {};
        const response = await axios.get('/settings', { params });
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load settings');
    }
});

export const saveSettings = createAsyncThunk('settings/save', async (settings, { rejectWithValue }) => {
    try {
        await axios.post('/settings', { settings });
        return settings;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to save settings');
    }
});

export const clearAppData = createAsyncThunk('settings/clearData', async (type, { rejectWithValue }) => {
    try {
        const response = await axios.post('/settings/clear-data', { type });
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to clear data');
    }
});

const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        data: {},
        loading: false,
        saving: false,
        error: null,
        clearResult: null,
    },
    reducers: {
        clearSettingsError: (state) => { state.error = null; },
        clearClearResult: (state) => { state.clearResult = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSettings.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchSettings.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
            .addCase(fetchSettings.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(saveSettings.pending, (state) => { state.saving = true; })
            .addCase(saveSettings.fulfilled, (state, action) => {
                state.saving = false;
                action.payload.forEach(s => { state.data[s.key] = s.value; });
            })
            .addCase(saveSettings.rejected, (state, action) => { state.saving = false; state.error = action.payload; })
            .addCase(clearAppData.fulfilled, (state, action) => { state.clearResult = action.payload; })
            .addCase(clearAppData.rejected, (state, action) => { state.error = action.payload; });
    },
});

export const { clearSettingsError, clearClearResult } = settingsSlice.actions;
export default settingsSlice.reducer;
