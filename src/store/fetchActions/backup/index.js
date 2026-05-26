import { api } from '../../../services/api';

const parseErrorBlob = async (blob) => {
    if (!blob || typeof blob.text !== 'function') return null;
    try {
        const text = await blob.text();
        const json = JSON.parse(text);
        return json?.message || null;
    } catch {
        return null;
    }
};

export const downloadBackup = () => async () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10);
    const fileName = `sysdoc-backup-${datePart}.sql`;

    try {
        const res = await api.get('/admin/backup/download', { responseType: 'blob' });

        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/octet-stream' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        const status = err?.response?.status;
        const serverMsg = await parseErrorBlob(err?.response?.data);

        const error = new Error(serverMsg || 'Erro desconhecido');
        error.status = status;
        throw error;
    }
};
