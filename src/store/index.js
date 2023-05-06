import { configureStore } from '@reduxjs/toolkit';

import layoutReducer from './ducks/Layout';
import letterReducer from './ducks/letters';
import userReducer from './ducks/users';
import authReducer from './ducks/auth';
import modelReducer from './ducks/models';
import serviceReducer from './ducks/service_calls';
import roomReducer from './ducks/rooms';
import callReducer from './ducks/calls';


export default configureStore({
    reducer: {
        auth: authReducer, 
        layout: layoutReducer, 
        users: userReducer,
        letters: letterReducer,
        models: modelReducer,
        services: serviceReducer,
        rooms: roomReducer,
        calls: callReducer
    },
});