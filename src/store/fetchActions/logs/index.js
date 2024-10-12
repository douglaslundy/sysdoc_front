import { api } from "../../../services/api";
import { addLogs } from "../../ducks/logs";
import { turnLoading } from "../../ducks/Layout";

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
