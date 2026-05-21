import { turnLoading, addAlertMessage } from "../ducks/Layout";

export const extractApiErrorMessage = (error, fallback = 'Não foi possível concluir a operação.') => {
    const data = error?.response?.data;
    if (!data) return fallback;

    if (typeof data.message === 'string' && data.message.trim() !== '') {
        return data.message;
    }

    if (data.errors && typeof data.errors === 'object') {
        const firstField = Object.values(data.errors)[0];
        if (Array.isArray(firstField) && firstField.length > 0 && typeof firstField[0] === 'string') {
            return firstField[0];
        }
    }

    return fallback;
};

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
                    const msg = extractApiErrorMessage(error, 'Não foi possível concluir a operação.');
                    dispatch(addAlertMessage(msg));
                }
                dispatch(turnLoading());
            });
    };
};
