import { api } from "../../../services/api";
import { addLogs, setLogsMeta } from "../../ducks/logs";
import { apiAction } from "../helpers";

export const getAllLogs = (page = 1, perPage = 50) =>
    apiAction(
        () => api.get('/logs', { params: { page, per_page: perPage } }),
        {
            onSuccess: (res, dispatch) => {
                dispatch(addLogs(res.data.data));
                dispatch(setLogsMeta(res.data));
            },
        }
    );
