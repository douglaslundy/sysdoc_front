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

export const downloadFiscalizacaoAttachment = async (fiscalizacaoId, attachment) => {
    const response = await api.get(
        `/fiscalizacoes/${fiscalizacaoId}/attachments/${attachment.id}/download`,
        { responseType: 'blob' }
    );

    const blob = new Blob([response.data], { type: attachment.mime_type || 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = attachment.original_name || `anexo-${attachment.id}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(url);
};
