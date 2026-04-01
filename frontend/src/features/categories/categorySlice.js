import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../../api/axios';

export const fetchCategories = createAsyncThunk('categories/fetch', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get('/categories');
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load categories');
    }
});

export const fetchCategoriesFlat = createAsyncThunk('categories/fetchFlat', async (_, { rejectWithValue }) => {
    try {
        const response = await axios.get('/categories/flat');
        return response.data;
    } catch (error) {
        return rejectWithValue('Failed to load categories');
    }
});

export const createCategory = createAsyncThunk('categories/create', async (data, { rejectWithValue }) => {
    try {
        const response = await axios.post('/categories', data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
});

export const updateCategory = createAsyncThunk('categories/update', async ({ id, ...data }, { rejectWithValue }) => {
    try {
        const response = await axios.put(`/categories/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to update category');
    }
});

export const deleteCategory = createAsyncThunk('categories/delete', async (id, { rejectWithValue }) => {
    try {
        await axios.delete(`/categories/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
    }
});

const categorySlice = createSlice({
    name: 'categories',
    initialState: { tree: [], flat: [], loading: false, error: null },
    reducers: {
        clearCategoryError: (state) => { state.error = null; },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => { state.loading = true; state.error = null; })
            .addCase(fetchCategories.fulfilled, (state, action) => { state.loading = false; state.tree = action.payload; })
            .addCase(fetchCategories.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
            .addCase(fetchCategoriesFlat.fulfilled, (state, action) => { state.flat = action.payload; })
            .addCase(createCategory.rejected, (state, action) => { state.error = action.payload; })
            .addCase(updateCategory.rejected, (state, action) => { state.error = action.payload; })
            .addCase(deleteCategory.rejected, (state, action) => { state.error = action.payload; });
    },
});

export const { clearCategoryError } = categorySlice.actions;
export default categorySlice.reducer;
