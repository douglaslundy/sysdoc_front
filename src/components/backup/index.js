import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../baseCard/BaseCard';
import { modalFormRootSx } from '../modal/_shared/modalFormStyles';
import { downloadBackup } from '../../store/fetchActions/backup';

export default function Backup() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleDownload = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await downloadBackup()();
            setSuccess(true);
        } catch (err) {
            const status = err?.status;
            if (status === 403) {
                setError('Acesso negado. Somente administradores podem fazer backup.');
            } else if (status === 401) {
                setError('Sessão expirada. Faça login novamente.');
            } else if (status === 500) {
                setError(`Erro interno no servidor ao gerar backup. Verifique os logs do backend.`);
            } else if (!status) {
                setError('Sem resposta do servidor. Verifique a conexão com a API.');
            } else {
                setError(`Erro ${status} ao gerar backup. Tente novamente.`);
            }
            console.error('[Backup] Erro:', status, err?.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={modalFormRootSx} className="queue-page backup-page">
        <BaseCard title="Backup do Banco de Dados">
            <Box display="flex" flexDirection="column" gap={3} maxWidth={560}>
                <Box display="flex" alignItems="flex-start" gap={2}>
                    <FeatherIcon icon="database" width="32" height="32" color="#1976d2" />
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Exportar dump SQL completo
                        </Typography>
                        <Typography variant="body2" color="textSecondary" mt={0.5}>
                            Gera um arquivo <strong>.sql</strong> com a estrutura e os dados de todas as
                            tabelas do banco Sysdoc (MySQL, charset utf8mb4). O arquivo pode ser
                            importado diretamente em qualquer servidor MySQL compatível.
                        </Typography>
                    </Box>
                </Box>

                <Alert severity="warning" icon={<FeatherIcon icon="alert-triangle" width="18" height="18" />}>
                    Recomendado realizar o backup antes de atualizações ou manutenções.
                    O download pode levar alguns instantes dependendo do tamanho do banco.
                </Alert>

                {error && (
                    <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" onClose={() => setSuccess(false)}>
                        Backup gerado com sucesso. Verifique sua pasta de downloads.
                    </Alert>
                )}

                <Box>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={loading}
                        onClick={handleDownload}
                        startIcon={
                            loading
                                ? <CircularProgress size={18} color="inherit" />
                                : <FeatherIcon icon="download" width="18" height="18" />
                        }
                    >
                        {loading ? 'Gerando backup...' : 'Fazer Backup'}
                    </Button>
                </Box>
            </Box>
        </BaseCard>
        </Box>
    );
}
