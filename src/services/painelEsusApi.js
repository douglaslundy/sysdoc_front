import axios from 'axios';
import { api } from './api';

// Instância sem token — para o painel público (TV)
const publicHttp = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

export const painelEsusPublicApi = {
    validarCnes: (cnes, options = {}) =>
        publicHttp
            .get('/public/painel-esus/validar-cnes', { params: { cnes }, signal: options.signal })
            .then(r => r.data),
    estado: (cnes, options = {}) =>
        publicHttp
            .get('/public/painel-esus/estado', { params: { cnes }, signal: options.signal })
            .then(r => r.data),
};

// Usa a instância autenticada principal — para a gestão de fila
export const painelEsusApi = {
    fila: (params, options = {}) =>
        api.get('/painel-esus/fila', { params, signal: options.signal }).then(r => r.data),
    filtros: (cnes, options = {}) =>
        api.get('/painel-esus/filtros', { params: { cnes }, signal: options.signal }).then(r => r.data),
    unidades: (options = {}) =>
        api.get('/painel-esus/unidades', { signal: options.signal }).then(r => r.data),
};
