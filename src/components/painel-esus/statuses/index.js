import React, { useEffect, useState } from 'react';
import { Box, Chip, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
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
  const pageSx = {
    '& .MuiCardContent-root': {
      p: 0,
    },
    '& .MuiTypography-root': {
      color: theme.palette.text.primary,
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
    },
    '& .MuiOutlinedInput-root': {
      color: theme.palette.text.primary,
      background: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.3 : 0.92),
      borderRadius: 2,
      '& fieldset': {
        borderColor: theme.palette.divider,
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
    '& .MuiInputBase-root': {
      minHeight: 48,
      alignItems: 'center',
    },
    '& .MuiInputBase-input': {
      color: theme.palette.text.primary,
      paddingTop: '12px',
      paddingBottom: '12px',
    },
    '& .MuiInputBase-inputMultiline': {
      color: theme.palette.text.primary,
      WebkitTextFillColor: theme.palette.text.primary,
      backgroundColor: 'transparent',
    },
    '& .MuiSelect-select': {
      color: theme.palette.text.primary,
      display: 'flex',
      alignItems: 'center',
    },
    '& .MuiSelect-icon': {
      color: theme.palette.text.secondary,
    },
    '& .MuiTableHead-root .MuiTableCell-root': {
      color: theme.palette.text.secondary,
      fontWeight: 700,
      background: 'transparent',
      borderBottom: `1px solid ${theme.palette.divider}`,
      py: 1.6,
    },
    '& .MuiTableBody-root .MuiTableCell-root': {
      color: theme.palette.text.primary,
      borderBottom: `1px solid ${theme.palette.divider}`,
      py: 1.6,
    },
    '& .MuiTableRow-root:hover .MuiTableCell-root': {
      backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.06 : 0.04),
    },
    '& .queue-page__th': {
      color: theme.palette.text.secondary,
    },
    '& .queue-page__table .MuiTableCell-root': {
      borderBottomColor: theme.palette.divider,
    },
    '& .MuiChip-root': {
      fontWeight: 700,
    },
    '& .MuiChip-colorSuccess': {
      color: theme.palette.mode === 'dark' ? theme.palette.success.light : theme.palette.success.dark,
      backgroundColor: alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.16 : 0.12),
      border: `1px solid ${alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.3 : 0.2)}`,
    },
    '& .MuiChip-colorError': {
      color: theme.palette.mode === 'dark' ? theme.palette.error.light : theme.palette.error.dark,
      backgroundColor: alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.16 : 0.12),
      border: `1px solid ${alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.3 : 0.2)}`,
    },
  };

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
    <Box className="queue-page painel-esus-statuses-page" sx={[{ py: 2 }, modalFormRootSx, pageSx]}>
      <BaseCard title="Status dos Painéis de Senha">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Lista de CNES com indicador visual de conectividade.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="painel-esus-status-filter-label" shrink>Status</InputLabel>
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
                {filteredItems.map((item, index) => (
                  <React.Fragment key={item.cnes}>
                    <TableRow hover>
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
                    {index < filteredItems.length - 1 ? (
                    <TableRow>
                        <TableCell colSpan={4} sx={{ py: 0, borderBottom: 'none' }}>
                          <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}`, opacity: 0.95 }} />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </React.Fragment>
                ))}
                {!filteredItems.length && (
                  <TableRow
                    sx={{
                      '& td': {
                        borderBottom: `1px solid ${theme.palette.divider}`,
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
