import { api } from "../../../services/api";
import { addErrorLog, addErrorLogs, setErrorLogsMeta } from "../../ducks/errorlogs";
import { turnLoading } from "../../ducks/Layout";

export const getAllErrorLogs = (page = 1, perPage = 50) => {
    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/errorlogs', { params: { page, per_page: perPage } })
            .then((res) => {
                dispatch(addErrorLogs(res.data.data));
                dispatch(setErrorLogsMeta(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) });
    };
};
