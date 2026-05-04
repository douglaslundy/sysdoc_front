import { turnLoading, addAlertMessage } from "../../ducks/Layout";
import { setAuthToken } from "../../../services/api";
import Router from "next/router";
import { destroyCookie } from 'nookies';

export const loginFetch = (dataUser) => {
    return (dispatch) => {
        dispatch(turnLoading());

        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataUser),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    dispatch(addAlertMessage(data.message || 'Erro desconhecido'));
                    dispatch(turnLoading());
                    return;
                }
                // Token is in httpOnly cookie; hydrate axios in-memory via /me
                const meRes = await fetch('/api/auth/me');
                if (meRes.ok) {
                    const meData = await meRes.json();
                    setAuthToken(meData.token);
                }
                dispatch(turnLoading());
                Router.push('/');
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
