import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../../services/api';
import { Banner } from '../ui/banner';
import { Button, buttonVariants } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Carregando } from '../ui/carregando';
import { Gaveta } from '../ui/gaveta';
import { Pilula } from '../ui/pilula';

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

const TOM_DO_ALERTA = { success: 'sucesso', error: 'perigo', warning: 'alerta' };

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

function Rotulo({ children }) {
  return <p className="text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">{children}</p>;
}

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
    <Gaveta aberto={historyOpen} aoFechar={() => setHistoryOpen(false)} titulo="Histórico">
      {historyLoading ? (
        <Carregando>Carregando histórico...</Carregando>
      ) : historico.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum registro encontrado para este documento.</p>
      ) : (
        <ul className="divide-y divide-border">
          {historico.map((item) => (
            <li key={item.id} className="py-3">
              <p className="text-sm font-semibold">{formatAction(item.action)}</p>
              <p className="text-sm text-muted-foreground">
                {item.user_name || 'Sistema'} • {formatDateTime(item.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Gaveta>
  );

  const mainArea = (
    <div className="documentos-page grid gap-4">
      {alertState.visible && (
        <Banner tom={TOM_DO_ALERTA[alertState.type] || 'info'} onDispensar={() => setAlertState({ visible: false, type: 'success', message: '' })}>
          {alertState.message}
        </Banner>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{documento?.titulo || 'Documento'}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="flex flex-wrap gap-2">
            {!embedded && (
              <a className={buttonVariants({ variant: 'outline' })} href="/documentos">
                Voltar
              </a>
            )}
            <Button variant="outline" onClick={handleOpenHistory} disabled={loading}>
              Histórico
            </Button>
            {embedded && onClose && (
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            )}
          </div>

          {loading ? (
            <Carregando>Carregando documento...</Carregando>
          ) : documento ? (
            <div className="grid gap-5">
              <div>
                <Rotulo>Tipo</Rotulo>
                <p className="font-display text-base font-bold">{documento.type?.nome || '—'}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Pilula tom="neutro" contorno>{SIGILO_LABELS[documento.sigilo] || documento.sigilo || '—'}</Pilula>
                <Pilula tom="neutro" contorno>{STATUS_LABELS[documento.status] || documento.status || '—'}</Pilula>
                <Pilula tom="neutro" contorno>{`Versão ${documento.current_version_number || 0}`}</Pilula>
              </div>

              <div>
                <Rotulo>Resumo</Rotulo>
                <p className="whitespace-pre-wrap text-base">{documento.resumo || 'Sem resumo informado.'}</p>
              </div>

              <div className="grid gap-1 text-sm text-muted-foreground">
                <p>Criado por: <strong className="text-foreground">{documento.creator?.name || '—'}</strong></p>
                <p>Última atualização: <strong className="text-foreground">{formatDateTime(documento.updated_at)}</strong></p>
              </div>

              {sortedVersions.length > 0 && (
                <div>
                  <Rotulo>Arquivos anexados</Rotulo>
                  <ul className="mt-2 divide-y divide-border">
                    {sortedVersions.map((v) => (
                      <li key={v.id} className="min-w-0 py-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadVersion(v)}
                          className="block max-w-full truncate text-left text-sm font-bold text-primary-text hover:underline focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
                        >
                          {v.original_name || 'arquivo'}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          Versão {v.version_number}
                          {v.uploader?.name ? ` • ${v.uploader.name}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {sortedVersions.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum arquivo anexado a este documento.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Documento não encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={embedded ? 'h-full overflow-auto p-4 sm:p-6' : undefined}>
      {mainArea}
      {historyPanel}
    </div>
  );
}
