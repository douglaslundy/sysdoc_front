import axios from "axios";
import { parseCookies } from 'nookies';

const { 'sysvendas.token': token } = parseCookies();

export const api = axios.create({
    baseURL: '//doc.dlsistemas.com.br/api'
    // baseURL: 'http://localhost:8000/api'
});

// api.interceptors.request.use(config => {
//     console.log(config);
//     return config;
// })

if (token) {
    api.defaults.headers['Authorization'] = `Bearer ${token}`;
}

