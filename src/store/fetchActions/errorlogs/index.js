import { api } from "../../../services/api";
import { addErrorLogs, setErrorLogsMeta } from "../../ducks/errorlogs";
import { apiAction } from "../helpers";

export const getAllErrorLogs = (page = 1, perPage = 50) =>
    apiAction(
        () => api.get('/errorlogs', { params: { page, per_page: perPage } }),
        {
            onSuccess: (res, dispatch) => {
                dispatch(addErrorLogs(res.data.data));
                dispatch(setErrorLogsMeta(res.data));
            },
        }
    );
