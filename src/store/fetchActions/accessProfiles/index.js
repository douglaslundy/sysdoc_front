import { api } from '../../../services/api';
import {
    addProfiles, addProfile, editProfile, removeProfile, showProfile,
    addPages, addPage, editPage, removePage,
    setPageCategories, addPageCategory, editPageCategory, removePageCategory,
    setMyPermissions
} from '../../ducks/accessProfiles';
import { turnLoading, addMessage, addAlertMessage, turnAlert } from '../../ducks/Layout';

export const getAllProfiles = () => (dispatch) => {
    dispatch(turnLoading());
    api.get('/access-profiles')
        .then(res => { dispatch(addProfiles(res.data)); dispatch(turnLoading()); })
        .catch(() => dispatch(turnLoading()));
};

export const getAllPages = ({ silent = false } = {}) => (dispatch) => {
    if (!silent) dispatch(turnLoading());
    api.get('/system-pages')
        .then(res => {
            dispatch(addPages(res.data));
            if (!silent) dispatch(turnLoading());
        })
        .catch(() => {
            if (!silent) dispatch(turnLoading());
        });
};

export const getAllPageCategories = () => (dispatch) => {
    dispatch(turnLoading());
    api.get('/page-categories')
        .then(res => { dispatch(setPageCategories(res.data)); dispatch(turnLoading()); })
        .catch(() => dispatch(turnLoading()));
};

export const addProfileFetch = (data, onSuccess) => (dispatch) => {
    dispatch(turnLoading());
    api.post('/access-profiles', data)
        .then(res => {
            dispatch(addProfile(res.data));
            dispatch(addMessage(`Perfil "${res.data.nome}" criado!`));
            dispatch(turnAlert());
            dispatch(turnLoading());
            onSuccess && onSuccess();
        })
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || 'Erro ao criar perfil'));
            dispatch(turnLoading());
        });
};

export const editProfileFetch = (id, data, onSuccess) => (dispatch) => {
    dispatch(turnLoading());
    api.put(`/access-profiles/${id}`, data)
        .then(res => {
            dispatch(editProfile(res.data));
            dispatch(addMessage(`Perfil "${res.data.nome}" atualizado!`));
            dispatch(turnAlert());
            dispatch(turnLoading());
            onSuccess && onSuccess();
        })
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || 'Erro ao atualizar perfil'));
            dispatch(turnLoading());
        });
};

export const removeProfileFetch = (id) => (dispatch) => {
    dispatch(turnLoading());
    api.delete(`/access-profiles/${id}`)
        .then(() => {
            dispatch(removeProfile({ id }));
            dispatch(addMessage('Perfil removido!'));
            dispatch(turnAlert());
            dispatch(turnLoading());
        })
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || 'Erro ao remover perfil'));
            dispatch(turnLoading());
        });
};

export const addPageFetch = (data, onSuccess) => (dispatch) => {
    dispatch(turnLoading());
    api.post('/system-pages', data)
        .then(res => {
            dispatch(addPage(res.data));
            dispatch(addMessage(`Página "${res.data.titulo}" criada!`));
            dispatch(turnAlert());
            dispatch(turnLoading());
            onSuccess && onSuccess();
        })
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || 'Erro ao criar página'));
            dispatch(turnLoading());
        });
};

export const editPageFetch = (id, data, onSuccess) => (dispatch) => {
    dispatch(turnLoading());
    api.put(`/system-pages/${id}`, data)
        .then(res => {
            dispatch(editPage(res.data));
            dispatch(addMessage(`Página "${res.data.titulo}" atualizada!`));
            dispatch(turnAlert());
            dispatch(turnLoading());
            onSuccess && onSuccess();
        })
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || 'Erro ao atualizar página'));
            dispatch(turnLoading());
        });
};

export const removePageFetch = (id) => (dispatch) => {
    dispatch(turnLoading());
    api.delete(`/system-pages/${id}`)
        .then(() => {
            dispatch(removePage({ id }));
            dispatch(addMessage('Página removida!'));
            dispatch(turnAlert());
            dispatch(turnLoading());
        })
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || 'Erro ao remover página'));
            dispatch(turnLoading());
        });
};

export const addPageCategoryFetch = (data, onSuccess) => (dispatch) => {
    dispatch(turnLoading());
    api.post('/page-categories', data)
        .then(res => {
            dispatch(addPageCategory(res.data));
            dispatch(addMessage(`Categoria "${res.data.nome}" criada!`));
            dispatch(turnAlert());
            dispatch(turnLoading());
            onSuccess && onSuccess();
        })
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || err?.response?.data?.error || 'Erro ao criar categoria'));
            dispatch(turnLoading());
        });
};

export const editPageCategoryFetch = (id, data, onSuccess) => (dispatch) => {
    dispatch(turnLoading());
    api.put(`/page-categories/${id}`, data)
        .then(res => {
            dispatch(editPageCategory(res.data));
            dispatch(addMessage(`Categoria "${res.data.nome}" atualizada!`));
            dispatch(turnAlert());
            dispatch(turnLoading());
            onSuccess && onSuccess();
        })
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || err?.response?.data?.error || 'Erro ao atualizar categoria'));
            dispatch(turnLoading());
        });
};

export const removePageCategoryFetch = (id) => (dispatch) => {
    dispatch(turnLoading());
    api.delete(`/page-categories/${id}`)
        .then(() => {
            dispatch(removePageCategory({ id }));
            dispatch(addMessage('Categoria removida!'));
            dispatch(turnAlert());
            dispatch(turnLoading());
        })
        .catch(err => {
            dispatch(addAlertMessage(err?.response?.data?.message || err?.response?.data?.error || 'Erro ao remover categoria'));
            dispatch(turnLoading());
        });
};

export const getMyPermissions = () => (dispatch) => {
    api.get('/auth/my-permissions')
        .then(res => dispatch(setMyPermissions(res.data.paths || [])))
        .catch(() => {});
};
