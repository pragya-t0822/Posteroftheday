import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchNavigation = createAsyncThunk(
    'navigation/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get('/navigation');
            return response.data;
        } catch (error) {
            return rejectWithValue('Failed to load navigation');
        }
    }
);

const navigationSlice = createSlice({
    name: 'navigation',
    initialState: {
        items: [],
        loading: false,
    },
    reducers: {
        clearNavigation: (state) => {
            state.items = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchNavigation.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNavigation.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchNavigation.rejected, (state) => {
                state.loading = false;
            });
    },
});

export const { clearNavigation } = navigationSlice.actions;
export default navigationSlice.reducer;
