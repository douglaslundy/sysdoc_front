import React, { useEffect, useState } from 'react';
import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import BaseCard from '../../baseCard/BaseCard';
import { api } from '../../../services/api';
import TableLoadingRows from '../../tableLoadingRows';
import { modalFormRootSx } from '../../modal/_shared/modalFormStyles';

const formatRelativeTime = (value) => {
  if (!value) return 'Sem atualização';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'Sem atualização';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60)));
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays} dias`;
};

export default function PainelEsusStatuses() {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.get('/painel-esus/statuses')
      .then((res) => {
        if (mounted) setItems(res.data?.items || []);
      })
      .catch(() => {
        if (mounted) setItems([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredItems = items.filter((item) => {
    if (statusFilter === 'online') return Boolean(item.is_online);
    if (statusFilter === 'offline') return !item.is_online;
    return true;
  });

  return (
    <Box className="queue-page painel-esus-statuses-page" sx={[{ py: 2 }, modalFormRootSx]}>
      <BaseCard title="Status dos Painéis de Senha">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Lista de CNES com indicador visual de conectividade.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="painel-esus-status-filter-label">Status</InputLabel>
            <Select
              labelId="painel-esus-status-filter-label"
              id="painel-esus-status-filter"
              value={statusFilter}
              label="Status"
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="offline">Offline</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer className="queue-page__table-wrap">
          <Table className="queue-page__table" sx={{ whiteSpace: 'nowrap', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
            <TableHead>
              <TableRow>
                <TableCell className="queue-page__th"><Typography variant="h6">CNES</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Nome</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Status</Typography></TableCell>
                <TableCell className="queue-page__th"><Typography variant="h6">Última atualização</Typography></TableCell>
              </TableRow>
            </TableHead>
            {loading ? (
              <TableLoadingRows columns={4} rows={6} />
            ) : (
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.cnes}
                    hover
                    sx={{
                      '& td': {
                        borderBottom: '0.5px solid var(--lg-border-row)',
                      },
                    }}
                  >
                    <TableCell>{item.cnes}</TableCell>
                    <TableCell>{item.panel_name || item.nome || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.is_online ? 'Online' : 'Offline'}
                        color={item.is_online ? 'success' : 'error'}
                      />
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.secondary }}>
                      {formatRelativeTime(item.last_seen_at)}
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredItems.length && (
                  <TableRow
                    sx={{
                      '& td': {
                        borderBottom: '0.5px solid var(--lg-border-row)',
                      },
                    }}
                  >
                    <TableCell colSpan={4} align="center">
                      Nenhum CNES encontrado para o filtro selecionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </TableContainer>
      </BaseCard>
    </Box>
  );
}
