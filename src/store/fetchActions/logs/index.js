import { api } from "../../../services/api";
import { addLogs, setLogsMeta } from "../../ducks/logs";
import { turnLoading } from "../../ducks/Layout";

export const getAllLogs = (page = 1, perPage = 50) => {
    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/logs', { params: { page, per_page: perPage } })
            .then((res) => {
                dispatch(addLogs(res.data.data));
                dispatch(setLogsMeta(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) });
    };
};
