import { api } from "../../../services/api";
import { addErrorLog, addErrorLogs } from "../../ducks/errorlogs";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";

export const getAllErrorLogs = () => {

    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/errorlogs')
            .then((res) => {
                dispatch(addErrorLogs(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}
