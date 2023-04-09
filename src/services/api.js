import axios from "axios";
import { parseCookies } from 'nookies';

const { 'sysvendas.token': token } = parseCookies();

export const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL
});

if (token) {
    api.defaults.headers['Authorization'] = `Bearer ${token}`;
}

