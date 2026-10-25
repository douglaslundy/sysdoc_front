import { listarPostes } from "../../../services/iluminacaoPostes";
import { setPostes, setPostesPagination } from "../../ducks/iluminacaoPostes";
import { addAlertMessage, turnLoading } from "../../ducks/Layout";

export const getPostes = (params = {}) => {
  return (dispatch) => {
    dispatch(turnLoading());
    return listarPostes(params)
      .then((res) => {
        dispatch(setPostes(res.data));
        dispatch(setPostesPagination(res.meta));
        dispatch(turnLoading());
      })
      .catch((error) => {
        dispatch(addAlertMessage(error?.response?.data?.message || "Não foi possível carregar os postes."));
        dispatch(turnLoading());
      });
  };
};
