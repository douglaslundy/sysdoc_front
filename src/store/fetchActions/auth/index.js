import { api } from "../../../services/api";
import { turnLoading, addAlertMessage } from "../../ducks/Layout";
import Router from "next/router";
import { parseCookies, setCookie, destroyCookie } from 'nookies'

export const loginFetch = (dataUser) => {
    return (dispatch) => {
        dispatch(turnLoading())
        api.post('/login', dataUser)
            .then((res) =>
            (

                setCookie(undefined, 'sysvendas.token', res.data.token, {
                    maxAge: 60 * 60 * 72, // 72 hour
                }),

                setCookie(undefined, 'sysvendas.id', res.data.user.id, {
                    maxAge: 60 * 60 * 72, // 72 hour
                }),
                setCookie(undefined, 'sysvendas.username', res.data.user.name, {
                    maxAge: 60 * 60 * 72, // 72 hour
                }),

                setCookie(undefined, 'sysvendas.profile', res.data.user.profile, {
                    maxAge: 60 * 60 * 72, // 72 hour
                }),


                dispatch(turnLoading()),
                Router.push('/')
            ))
            .catch((error) => {

                dispatch(addAlertMessage(error.response ? ` ${error.response.data.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
};

export const logoutFetch = () => {
    return (dispatch) => {
        dispatch(turnLoading())
        api
            .post('/logout')
            .then((res) =>
            (
                dispatch(turnLoading()),
                destroyCookie(null, 'sysvendas.id'),
                destroyCookie(null, 'sysvendas.token'),
                destroyCookie(null, 'sysvendas.username'),
                destroyCookie(null, 'sysvendas.profile'),
                Router.push('/login'),
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
};