import { api } from "../../../services/api";
import { addQrCodeLogs, setQrCodeLogsTotal } from "../../ducks/qrcodelogs";
import { turnLoading } from "../../ducks/Layout";

export const getAllQrCodeLogs = ({ page = 0, perPage = 10 } = {}) => {

    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/qrcode-logs', { params: { page: page + 1, per_page: perPage } })
            .then((res) => {
                dispatch(addQrCodeLogs(res.data.data));
                dispatch(setQrCodeLogsTotal(res.data.total));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}
