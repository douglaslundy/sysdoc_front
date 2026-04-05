import { api } from "../../../services/api";
import { addStates } from "../../ducks/states";
import { turnLoading } from "../../ducks/Layout";

export const getAllStates = () => {
    return async (dispatch) => {
        dispatch(turnLoading());

        try {
            const res = await api.get('/states');

            const formattedStates = res.data.map(({ code, name }) => ({
                id: code,
                name
            }));

            dispatch(addStates(formattedStates));
        } catch (err) {
            console.error(err);
        } finally {
            dispatch(turnLoading());
        }
    };
};