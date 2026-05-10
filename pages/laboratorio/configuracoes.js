import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Card, CardContent, CircularProgress, Switch, FormControlLabel, Typography } from '@mui/material';
import FeatherIcon from 'feather-icons-react';
import BaseCard from '../../src/components/baseCard/BaseCard';
import AlertModal from '../../src/components/messagesModal';
import { getLabConfig, updateLabConfig } from '../../src/store/fetchActions/labConfig';

export default function ConfiguracoesLaboratorio() {
    const dispatch = useDispatch();
    const { config, loading } = useSelector(state => state.labConfig);

    useEffect(() => { dispatch(getLabConfig()); }, []);

    const handleToggleEmail = (e) => {
        dispatch(updateLabConfig({ email_habilitado: e.target.checked }));
    };

    return (
        <Box>
            <AlertModal />
            <BaseCard title="Configurações do Laboratório">
                {loading && !config ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Card variant="outlined" sx={{ maxWidth: 500 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Envio de E-mail
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={config?.email_habilitado ?? false}
                                        onChange={handleToggleEmail}
                                        disabled={loading}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Box>
                                        <Typography variant="body1">
                                            {config?.email_habilitado ? 'E-mail habilitado' : 'E-mail desabilitado'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Quando habilitado, envia e-mail ao paciente ao liberar resultado.
                                            Requer e-mail do paciente cadastrado.
                                        </Typography>
                                    </Box>
                                }
                            />
                        </CardContent>
                    </Card>
                )}
            </BaseCard>
        </Box>
    );
}
