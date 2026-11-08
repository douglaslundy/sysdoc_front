import { api } from "../../../services/api";
import { lerAtiva, resolverAtiva, setAtiva, setLista } from "../../ducks/secretaria";

/** Carrega as secretarias do usuário e corrige a ativa persistida se for inválida. */
export const getSecretarias = () => async (dispatch) => {
  try {
    const { data } = await api.get("/auth/secretarias");
    dispatch(setLista(data));
    const persistida = lerAtiva();
    const valida = resolverAtiva(persistida, data.secretarias, data.pode_todas);
    dispatch(setAtiva(valida));
  } catch (_) {
    // sem lista, o seletor simplesmente não aparece
  }
};
