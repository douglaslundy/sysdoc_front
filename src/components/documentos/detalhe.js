import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Divider, Drawer, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import BaseCard from '../baseCard/BaseCard';
import { api } from '../../services/api';

const SIGILO_LABELS = {
  publico: 'Público',
  interno: 'Interno',
  restrito: 'Restrito/Sigiloso',
};

const STATUS_LABELS = {
  rascunho: 'Rascunho',
  publicado: 'Publicado',
};

const ACTION_LABELS = {
  CREATE: 'Documento criado',
  UPDATE: 'Documento atualizado',
  VIEW: 'Documento visualizado',
  DOWNLOAD: 'Arquivo baixado',
  DELETE: 'Documento excluído',
  VERSION_CREATE: 'Nova versão enviada',
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatAction = (value) =>
  ACTION_LABELS[value] ||
  String(value || 'Evento')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase());

export default function DocumentoDetalhe({ documentId = null, embedded = false, onClose = null }) {
  const router = useRouter();
  const { id } = router.query;
  const activeId = documentId || id;
  const [documento, setDocumento] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [alertState, setAlertState] = useState({ visible: false, type: 'success', message: '' });

  useEffect(() => {
    if ((!embedded && !router.isReady) || !activeId) {
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/documentos/${activeId}`);
        if (active) {
          setDocumento(data);
        }
      } catch (error) {
        if (active) {
          setAlertState({
            visible: true,
            type: 'error',
            message: error?.response?.data?.message || 'Não foi possível carregar o documento.',
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [activeId, embedded, router.isReady]);

  const handleDownloadVersion = async (version) => {
    if (!documento?.id || !version?.id) return;
    try {
      const response = await api.get(
        `/documentos/${documento.id}/versoes/${version.id}/download`,
        { responseType: 'blob' },
      );
      const blob = new Blob([response.data], {
        type: version.mime_type || 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setAlertState({
        visible: true,
        type: 'error',
        message: error?.response?.data?.message || 'Não foi possível abrir o arquivo.',
      });
    }
  };

  const handleOpenHistory = async () => {
    if (!documento?.id) return;

    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/documentos/${documento.id}/historico`);
      setHistorico(Array.isArray(data) ? data : []);
    } catch (error) {
      setAlertState({
        visible: true,
        type: 'error',
        message: error?.response?.data?.message || 'Não foi possível carregar o histórico do documento.',
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const sortedVersions = useMemo(
    () => [...(documento?.versions || [])].sort((a, b) => b.version_number - a.version_number),
    [documento],
  );

  const historyPanel = (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Histórico</Typography>
        <Button variant="outlined" size="small" onClick={() => setHistoryOpen(false)}>
          Fechar
        </Button>
      </Stack>

      {historyLoading ? (
        <Typography color="text.secondary">Carregando histórico...</Typography>
      ) : historico.length === 0 ? (
        <Typography color="text.secondary">Nenhum registro encontrado para este documento.</Typography>
      ) : (
        <Stack divider={<Divider flexItem />} spacing={0}>
          {historico.map((item) => (
            <Box key={item.id} sx={{ py: 1.5 }}>
              <Typography variant="subtitle2">{formatAction(item.action)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {item.user_name || 'Sistema'} • {formatDateTime(item.created_at)}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </>
  );

  const mainArea = (
    <Box className="queue-page documentos-page">
      {alertState.visible && (
        <Alert
          sx={{ mb: 2 }}
          variant="filled"
          severity={alertState.type}
          onClose={() => setAlertState({ visible: false, type: 'success', message: '' })}
        >
          {alertState.message}
        </Alert>
      )}

      <BaseCard title={documento?.titulo || 'Documento'} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap' }}>
          {!embedded && (
            <Button variant="outlined" href="/documentos">
              Voltar
            </Button>
          )}
          <Button variant="outlined" onClick={handleOpenHistory} disabled={loading}>
            Histórico
          </Button>
          {embedded && onClose && (
            <Button variant="outlined" onClick={onClose}>
              Fechar
            </Button>
          )}
        </Stack>

        {loading ? (
          <Typography color="text.secondary">Carregando documento...</Typography>
        ) : documento ? (
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Tipo
              </Typography>
              <Typography variant="h6">{documento.type?.nome || '—'}</Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={SIGILO_LABELS[documento.sigilo] || documento.sigilo || '—'} size="small" />
              <Chip label={STATUS_LABELS[documento.status] || documento.status || '—'} size="small" />
              <Chip label={`Versão ${documento.current_version_number || 0}`} size="small" />
            </Box>

            <Box>
              <Typography variant="overline" color="text.secondary">
                Resumo
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {documento.resumo || 'Sem resumo informado.'}
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Criado por: <strong>{documento.creator?.name || '—'}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Última atualização: <strong>{formatDateTime(documento.updated_at)}</strong>
              </Typography>
            </Box>

            {sortedVersions.length > 0 && (
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Arquivos anexados
                </Typography>
                <Stack spacing={0} sx={{ mt: 1 }}>
                  {sortedVersions.map((v) => (
                    <Box
                      key={v.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        py: 1,
                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>
                          {v.original_name || 'arquivo'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Versão {v.version_number}
                          {v.uploader?.name ? ` • ${v.uploader.name}` : ''}
                        </Typography>
                      </Box>
                      <Button variant="outlined" size="small" onClick={() => handleDownloadVersion(v)}>
                        Baixar
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {sortedVersions.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Nenhum arquivo anexado a este documento.
              </Typography>
            )}
          </Stack>
        ) : (
          <Typography color="text.secondary">Documento não encontrado.</Typography>
        )}
      </BaseCard>
    </Box>
  );

  if (embedded) {
    return (
      <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>{mainArea}</Box>

        <Box
          sx={{
            width: historyOpen ? { xs: 300, sm: 400 } : 0,
            flexShrink: 0,
            overflow: 'hidden',
            transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
            borderLeft: historyOpen ? '1px solid var(--lg-border)' : 'none',
          }}
        >
          <Box sx={{ width: { xs: 300, sm: 400 }, height: '100%', overflow: 'auto', p: 2.5 }}>
            {historyPanel}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {mainArea}
      <Drawer
        anchor="right"
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 460 },
            p: 2.5,
          },
        }}
      >
        {historyPanel}
      </Drawer>
    </Box>
  );
}
