import { turnLoading, addAlertMessage } from "../ducks/Layout";

/**
 * Wraps an API call with automatic loading state management.
 *
 * @param {Function} apiFn - () => Promise — the API call to make
 * @param {Object}   options
 * @param {Function} options.onSuccess - (res, dispatch) => void
 * @param {Function} options.onError   - (error, dispatch) => void  (defaults to alert message)
 */
export const apiAction = (apiFn, { onSuccess, onError } = {}) => {
    return (dispatch) => {
        dispatch(turnLoading());

        return apiFn()
            .then((res) => {
                if (onSuccess) onSuccess(res, dispatch);
                dispatch(turnLoading());
            })
            .catch((error) => {
                if (onError) {
                    onError(error, dispatch);
                } else {
                    const msg = error.response?.data?.message ?? 'Erro desconhecido';
                    dispatch(addAlertMessage(msg));
                }
                dispatch(turnLoading());
            });
    };
};
