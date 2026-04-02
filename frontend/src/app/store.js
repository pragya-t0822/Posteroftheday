import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import navigationReducer from '../features/navigation/navigationSlice';
import roleReducer from '../features/roles/roleSlice';
import permissionReducer from '../features/permissions/permissionSlice';
import userReducer from '../features/users/userSlice';
import subscriptionReducer from '../features/subscriptions/subscriptionSlice';
import customerReducer from '../features/customer/customerSlice';
import customerManagementReducer from '../features/customers/customerManagementSlice';
import categoryReducer from '../features/categories/categorySlice';
import frameReducer from '../features/frames/frameSlice';
import frameLayerReducer from '../features/frameLayers/frameLayerSlice';
import settingsReducer from '../features/settings/settingsSlice';
import fontReducer from '../features/fonts/fontSlice';
import frameRequestReducer from '../features/frameRequests/frameRequestSlice';
import reminderReducer from '../features/reminders/reminderSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        navigation: navigationReducer,
        roles: roleReducer,
        permissions: permissionReducer,
        users: userReducer,
        subscriptions: subscriptionReducer,
        customer: customerReducer,
        customerManagement: customerManagementReducer,
        categories: categoryReducer,
        frames: frameReducer,
        frameLayers: frameLayerReducer,
        settings: settingsReducer,
        fonts: fontReducer,
        frameRequests: frameRequestReducer,
        reminders: reminderReducer,
    },
});
