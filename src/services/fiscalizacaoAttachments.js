import { api } from './api';

export const listFiscalizacaoAttachments = (fiscalizacaoId) =>
    api.get(`/fiscalizacoes/${fiscalizacaoId}/attachments`).then((res) => res.data);

export const uploadFiscalizacaoAttachments = (fiscalizacaoId, files) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files[]', file));
    return api.post(`/fiscalizacoes/${fiscalizacaoId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
};

export const deleteFiscalizacaoAttachment = (fiscalizacaoId, attachmentId) =>
    api.delete(`/fiscalizacoes/${fiscalizacaoId}/attachments/${attachmentId}`).then((res) => res.data);

export const downloadFiscalizacaoAttachmentUrl = (fiscalizacaoId, attachmentId) =>
    `/fiscalizacoes/${fiscalizacaoId}/attachments/${attachmentId}/download`;
