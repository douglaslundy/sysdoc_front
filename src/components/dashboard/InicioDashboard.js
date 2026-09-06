import React, { useEffect, useState } from 'react';
import { Grid, Box, Typography, Card, CardActionArea, CardContent, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import FeatherIcon from 'feather-icons-react';
import { api } from '../../services/api';
import { DashboardErro, getDashboardErrorMessage } from './DashboardStatus';

const SETOR_META = {
  farmacia: { icon: 'archive', destino: '/dashboard/farmacia' },
  vigilancia: { icon: 'shield', destino: '/dashboard/vigilancia' },
  almoxarifado: { icon: 'package', destino: '/dashboard/almoxarifado' },
  protocolo: { icon: 'file-text', destino: '/protocolo/caixa-entrada' },
  laboratorio: { icon: 'thermometer', destino: '/dashboard/laboratorio' },
  fila: { icon: 'users', destino: '/dashboard/fila' },
  tfd: { icon: 'truck', destino: '/dashboard/tfd' },
};

const ORDEM_SETORES = ['farmacia', 'vigilancia', 'almoxarifado', 'protocolo', 'laboratorio', 'fila', 'tfd'];

function SetorCard({ chave, setor, onClick }) {
  const meta = SETOR_META[chave];
  const alerta = Boolean(setor.alerta);

  const cores = alerta
    ? { iconBg: 'rgba(239, 68, 68, 0.16)', iconColor: '#f87171' }
    : { iconBg: 'rgba(37, 99, 235, 0.14)', iconColor: '#93c5fd' };

  return (
    <Card
      className={`dashboard-neon-kpi dashboard-neon-kpi--${alerta ? 'alerta' : 'blue'}`}
      sx={{
        height: '100%',
        transition: 'transform 0.15s ease',
        '&:hover': { transform: 'translateY(-2px)' },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography color="textSecondary" variant="subtitle1">{setor.label}</Typography>
              <Typography color="textSecondary" variant="caption" sx={{ display: 'block', mt: -0.5 }}>{setor.kpi || ''}</Typography>
              <Typography variant="h3" fontWeight="bold" mt={0.5}>{setor.valor ?? '—'}</Typography>
              <Typography color={alerta ? 'error' : 'textSecondary'} variant="body2" mt={1} fontWeight={alerta ? 700 : 400}>
                {alerta ? 'Requer atenção' : 'Sem pendências críticas'}
              </Typography>
            </Box>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%',
              background: cores.iconBg, display: 'grid', placeItems: 'center',
            }}>
              <FeatherIcon icon={meta.icon} color={cores.iconColor} width="28" height="28" />
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export default function InicioDashboard({ onNavigateToSetor }) {
  const router = useRouter();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    api.get('/dashboard/inicio')
      .then((res) => setDados(res.data))
      .catch((err) => setErro(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (erro || !dados?.setores) return <DashboardErro message={getDashboardErrorMessage('Inicio', erro)} />;

  const handleClick = (chave) => {
    const destino = SETOR_META[chave].destino;
    const trocouAba = onNavigateToSetor && onNavigateToSetor(destino);
    if (!trocouAba) router.push(destino);
  };

  const setoresVisiveis = ORDEM_SETORES.filter((chave) => dados.setores[chave]);

  if (setoresVisiveis.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Typography color="text.secondary">Nenhum setor disponível para o seu perfil.</Typography>
      </Box>
    );
  }

  return (
    <Box className="dashboard-neon-home" sx={{ mt: 1 }}>
      <Grid container spacing={3}>
        {setoresVisiveis.map((chave) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={chave}>
            <SetorCard chave={chave} setor={dados.setores[chave]} onClick={() => handleClick(chave)} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
