import { api } from "../../../services/api";
import { addQrCodeLogs } from "../../ducks/qrcodelogs";
import { turnLoading } from "../../ducks/Layout";

export const getAllQrCodeLogs = () => {

    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/qrcode-logs')
            .then((res) => {
                dispatch(addQrCodeLogs(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}
