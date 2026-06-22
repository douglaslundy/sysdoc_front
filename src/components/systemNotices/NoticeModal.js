import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import FeatherIcon from 'feather-icons-react';
import { useRouter } from 'next/router';
import { api } from '../../services/api';

export default function NoticeModal() {
  const theme = useTheme();
  const router = useRouter();
  const [queue, setQueue] = useState([]);
  const [current, setCurrent] = useState(null);
  const [open, setOpen] = useState(false);

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
    if (router.pathname === '/dashboard' || router.pathname === '/') {
      loadNotices();
    }
  }, [router.pathname]);

  useEffect(() => {
    if (!current?.id) return;
    api.post(`/system-notices/${current.id}/views`).catch(() => {});
  }, [current?.id]);

  const imageStyle = useMemo(() => ({
    width: '100%',
    maxHeight: 220,
    objectFit: 'cover',
    borderRadius: 16,
    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
  }), [theme]);

  const handleClose = () => {
    setOpen(false);
    const nextQueue = queue.slice(1);
    setQueue(nextQueue);
    setCurrent(nextQueue[0] || null);
    if (nextQueue.length > 0) {
      setTimeout(() => setOpen(true), 250);
    }
  };

  if (!current) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(10,15,30,0.98), rgba(15,23,42,0.96))'
            : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
          boxShadow: '0 24px 80px rgba(0,0,0,0.32)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.2 }}>
        <Typography variant="overline" color="primary.main" sx={{ letterSpacing: 1.8 }}>
          Aviso do Sistema
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ mt: 0.5 }}>
          {current.title}
        </Typography>
        {current.subtitle ? (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {current.subtitle}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent sx={{ pt: 1, pb: 0 }}>
        {current.image_data ? (
          <Box sx={{ mb: 2 }}>
            <img src={current.image_data} alt={current.title} style={imageStyle} />
          </Box>
        ) : null}
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {current.body}
        </Typography>
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
