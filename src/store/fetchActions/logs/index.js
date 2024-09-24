import { api } from "../../../services/api";
import { addLog, addLogs } from "../../ducks/logs";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { parseCookies } from "nookies";

export const getAllLogs = () => {

    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/logs')
            .then((res) => {
                dispatch(addLogs(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}
