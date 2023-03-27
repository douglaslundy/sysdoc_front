import { configureStore } from '@reduxjs/toolkit';

import layoutReducer from './ducks/Layout';
import letterReducer from './ducks/letters';
import userReducer from './ducks/users';
import authReducer from './ducks/auth';


export default configureStore({
    reducer: {
        letters: letterReducer,
        layout: layoutReducer, 
        users: userReducer,
        auth: authReducer,
    },
});