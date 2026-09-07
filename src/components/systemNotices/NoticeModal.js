import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import FeatherIcon from 'feather-icons-react';
import { useRouter } from 'next/router';
import { api } from '../../services/api';
import { modalBackdropSx } from '../modal/_shared/modalFormStyles';

export default function NoticeModal({ previewNotice, onPreviewClose } = {}) {
  const theme = useTheme();
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

  const imageStyle = useMemo(() => ({
    width: '100%',
    maxHeight: 220,
    objectFit: 'cover',
    borderRadius: 16,
    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
  }), [theme]);

  const formatNoticeBody = (body) => {
    const raw = String(body || '');
    if (!raw) return '';

    const hasHtml = /<[a-z][\s\S]*>/i.test(raw);
    if (hasHtml) {
      return raw;
    }

    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return escaped.replace(/\n/g, '<br />');
  };

  const [sanitizedBody, setSanitizedBody] = useState('');

  useEffect(() => {
    let active = true;

    import('dompurify')
      .then(({ default: DOMPurify }) => {
        if (!active) return;
        setSanitizedBody(DOMPurify.sanitize(formatNoticeBody(effectiveCurrent?.body)));
      })
      .catch(() => {
        // Se o DOMPurify não carregar, cair para HTML bruto seria inseguro — sempre escapar neste fallback,
        // mesmo que o aviso originalmente contivesse HTML confiável.
        if (!active) return;
        const escaped = String(effectiveCurrent?.body || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/\n/g, '<br />');
        setSanitizedBody(escaped);
      });

    return () => {
      active = false;
    };
  }, [effectiveCurrent?.body]);

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
    <Dialog
      open={effectiveOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ backdrop: { sx: modalBackdropSx } }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'var(--lg-glass-modal)',
          backdropFilter: 'var(--lg-blur-modal)',
          WebkitBackdropFilter: 'var(--lg-blur-modal)',
          border: '0.5px solid var(--lg-border)',
          boxShadow: 'var(--lg-shadow-modal)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.2 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1.8 }}>
          Aviso do Sistema
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
          {effectiveCurrent.title}
        </Typography>
        {effectiveCurrent.subtitle ? (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {effectiveCurrent.subtitle}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        {effectiveCurrent.image_data ? (
          <Box sx={{ mb: 2 }}>
            <img src={effectiveCurrent.image_data} alt={effectiveCurrent.title} style={imageStyle} />
          </Box>
        ) : null}
        <Box
          sx={{
            lineHeight: 1.8,
            color: 'text.primary',
            '& p': { my: 1.25 },
            '& h1, & h2, & h3': { mt: 2, mb: 1, fontWeight: 800, lineHeight: 1.2 },
            '& ul, & ol': { pl: 3, my: 1.25 },
            '& a': { color: 'primary.main' },
            '& strong': { fontWeight: 800 },
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedBody }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          variant="contained"
          onClick={handleClose}
          startIcon={<FeatherIcon icon="x" width="16" height="16" />}
          sx={{
            borderRadius: 999,
            px: 2.5,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary?.main || theme.palette.primary.dark})`,
          }}
        >
          Fechar aviso
        </Button>
      </DialogActions>
    </Dialog>
  );
}
