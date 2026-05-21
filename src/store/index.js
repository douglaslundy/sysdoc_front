import { configureStore } from '@reduxjs/toolkit';

import layoutReducer from './ducks/Layout';
import letterReducer from './ducks/letters';
import userReducer from './ducks/users';
import authReducer from './ducks/auth';
import modelReducer from './ducks/models';
import clientReducer from './ducks/clients';
import specialityReducer from './ducks/specialities';
import queueReducer from './ducks/queues';
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
import auditLogsReducer from './ducks/auditLogs';
import labConfigReducer from './ducks/labConfig';
import vigilanciaConfigReducer from './ducks/vigilanciaConfig';
import estabelecimentosReducer from './ducks/estabelecimentos';
import alvarasReducer from './ducks/alvaras';
import medicinesReducer from './ducks/medicines';
import medicineDailyStatusesReducer from './ducks/medicineDailyStatuses';
import medicineMonthlyAcquisitionsReducer from './ducks/medicineMonthlyAcquisitions';
import medicineComplianceReducer from './ducks/medicineCompliance';


export default configureStore({
    reducer: {
        auth: authReducer,
        layout: layoutReducer,
        users: userReducer,
        letters: letterReducer,
        models: modelReducer,
        clients: clientReducer,
        specialities: specialityReducer,
        queues: queueReducer,
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
        auditLogs: auditLogsReducer,
        labConfig: labConfigReducer,
        vigilanciaConfig: vigilanciaConfigReducer,
        estabelecimentos: estabelecimentosReducer,
        alvaras: alvarasReducer,
        medicines: medicinesReducer,
        medicineDailyStatuses: medicineDailyStatusesReducer,
        medicineMonthlyAcquisitions: medicineMonthlyAcquisitionsReducer,
        medicineCompliance: medicineComplianceReducer,
    },
});
