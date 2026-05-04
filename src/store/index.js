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
import errorlogReducer from './ducks/errorlogs';
import vehiclesReducer from './ducks/vehicles';
import routesReducer from './ducks/routes';
import tripsReducer from './ducks/trips';
import qrcodelogsReducer from './ducks/qrcodelogs';
import stateReducer from './ducks/states';
import ordinancesReducer from './ducks/ordinances';
import examesReducer from './ducks/exames';
import exameCamposReducer from './ducks/exameCampos';
import pedidosExameReducer from './ducks/pedidosExame';
import resultadoExamesReducer from './ducks/resultadoExames';
import categoriasExameReducer from './ducks/categoriasExame';
import medicosSolicitantesReducer from './ducks/medicosSolicitantes';
import accessProfilesReducer from './ducks/accessProfiles';


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
        logs: logReducer,
        errorlogs: errorlogReducer,
        vehicles: vehiclesReducer,
        routes: routesReducer,
        trips: tripsReducer,
        qrlogs: qrcodelogsReducer,
        states: stateReducer,
        ordinances: ordinancesReducer,
        exames: examesReducer,
        exameCampos: exameCamposReducer,
        pedidosExame: pedidosExameReducer,
        resultadoExames: resultadoExamesReducer,
        categoriasExame: categoriasExameReducer,
        medicosSolicitantes: medicosSolicitantesReducer,
        accessProfiles: accessProfilesReducer,
    },
});