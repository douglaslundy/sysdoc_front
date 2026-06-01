import { turnLoading, addAlertMessage } from "../../ducks/Layout";
import { setAuthToken } from "../../../services/api";
import Router from "next/router";
import { destroyCookie } from 'nookies';

export const loginFetch = (dataUser) => {
    return (dispatch) => {
        dispatch(turnLoading());

        const doLogin = async () => {
            const body = JSON.stringify(dataUser);
            const opts = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body,
            };
            const primary = await fetch('/api/auth/login', opts);
            if (primary.status !== 404) return primary;
            return fetch('/api/login', opts);
        };

        doLogin()
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    dispatch(addAlertMessage(data.message || 'Erro desconhecido'));
                    dispatch(turnLoading());
                    return;
                }
                // Full page reload to ensure AuthContext reinitializes cleanly
                // with the new session. Client-side navigation (Router.push) can
                // race against async state updates and leave the context stale.
                window.location.replace('/');
            })
            .catch(() => {
                dispatch(addAlertMessage('Erro ao conectar ao servidor'));
                dispatch(turnLoading());
            });
    };
};

export const logoutFetch = () => {
    return (dispatch) => {
        dispatch(turnLoading());

        fetch('/api/auth/logout', { method: 'POST' })
            .then(() => {
                setAuthToken(null);
                dispatch(turnLoading());
                Router.push('/login');
            })
            .catch(() => {
                // Force logout even if request fails
                setAuthToken(null);
                destroyCookie(null, 'sysvendas.id');
                destroyCookie(null, 'sysvendas.username');
                destroyCookie(null, 'sysvendas.profile');
                dispatch(turnLoading());
                Router.push('/login');
            });
    };
};
