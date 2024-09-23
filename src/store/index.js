import { configureStore } from '@reduxjs/toolkit';

import layoutReducer from './ducks/Layout';
import letterReducer from './ducks/letters';
import userReducer from './ducks/users';
import authReducer from './ducks/auth';
import modelReducer from './ducks/models';
import serviceReducer from './ducks/service_calls';
import roomReducer from './ducks/rooms';
import callReducer from './ducks/calls';
import clientReducer from './ducks/clients';
import specialityReducer from './ducks/specialities';
import queueReducer from './ducks/queues';
import logReducer from './ducks/logs';


export default configureStore({
    reducer: {
        auth: authReducer,
        layout: layoutReducer,
        users: userReducer,
        letters: letterReducer,
        models: modelReducer,
        services: serviceReducer,
        rooms: roomReducer,
        calls: callReducer,
        clients: clientReducer,
        specialities: specialityReducer,
        queues: queueReducer,
        logs: logReducer
    },
});