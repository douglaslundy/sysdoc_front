import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { X } from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../ui/button';
import { Dialogo, DialogoRodape, DialogoTitulo } from '../ui/dialogo';
import { TextoFormatado } from '../ui/texto-formatado';

export default function NoticeModal({ previewNotice, onPreviewClose } = {}) {
  const router = useRouter();
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [open, setOpen] = useState(false);

  const effectiveCurrent = previewNotice || current;
  const effectiveOpen = previewNotice ? true : open;

  const loadNotices = () => {
    api.get('/system-notices/active')
      .then((res) => {
        const notices = res.data || [];
        setQueue(notices);
        setCurrent(notices[0] || null);
        setOpen(Boolean(notices[0]));
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (previewNotice) return;
    if (router.pathname === '/dashboard' || router.pathname === '/') {
      loadNotices();
    }
  }, [router.pathname, previewNotice]);

  useEffect(() => {
    if (previewNotice) return;
    if (!current?.id) return;
    api.post(`/system-notices/${current.id}/views`).catch(() => {});
  }, [current?.id, previewNotice]);

  const handleClose = () => {
    if (previewNotice) {
      onPreviewClose && onPreviewClose();
      return;
    }
    setOpen(false);
    const nextQueue = queue.slice(1);
    setQueue(nextQueue);
    setCurrent(nextQueue[0] || null);
    if (nextQueue.length > 0) {
      setTimeout(() => setOpen(true), 250);
    }
  };

  if (!effectiveCurrent) return null;

  return (
    <Dialogo aberto={effectiveOpen} aoFechar={handleClose} tamanho="md">
      <div className="mb-3">
        <p className="text-xs font-bold tracking-[0.18em] text-primary-text uppercase">Aviso do Sistema</p>
        <DialogoTitulo className="mt-1 text-2xl">{effectiveCurrent.title}</DialogoTitulo>
        {effectiveCurrent.subtitle ? (
          <p className="mt-2 text-base text-muted-foreground">{effectiveCurrent.subtitle}</p>
        ) : null}
      </div>
      {effectiveCurrent.image_data ? (
        <img
          src={effectiveCurrent.image_data}
          alt={effectiveCurrent.title}
          className="mb-4 max-h-[220px] w-full rounded-xl border border-border object-cover"
        />
      ) : null}
      <TextoFormatado
        valor={effectiveCurrent.body}
        className="text-base leading-[1.8] [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-extrabold [&_strong]:font-extrabold"
      />
      <DialogoRodape>
        <Button onClick={handleClose}>
          <X /> Fechar aviso
        </Button>
      </DialogoRodape>
    </Dialogo>
  );
}
