import { api } from "../../../services/api";
import { turnLoading } from "../../ducks/Layout";
import { addModels } from "../../ducks/models";

export const getAllModels = () => {

    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/models')
            .then((res) => {
                dispatch(addModels(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}