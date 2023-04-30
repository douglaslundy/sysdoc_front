import { configureStore } from '@reduxjs/toolkit';

import layoutReducer from './ducks/Layout';
import letterReducer from './ducks/letters';
import userReducer from './ducks/users';
import authReducer from './ducks/auth';
import modelReducer from './ducks/models';
import serviceReducer from './ducks/service_calls';


export default configureStore({
    reducer: {
        auth: authReducer, 
        layout: layoutReducer, 
        users: userReducer,
        letters: letterReducer,
        models: modelReducer,
        services: serviceReducer
    },
});