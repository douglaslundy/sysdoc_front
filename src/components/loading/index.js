import { Backdrop, CircularProgress, Typography } from '@mui/material';
import { useRouter } from 'next/router';

import { useSelector, useDispatch } from 'react-redux';

import React from 'react';

export default function Loading() {
    const router = useRouter();

    const {
        isOpenLoading,
        isOpenModal,
        isOpenUserModal,
        isOpenModelModal,
        isOpenLetterModal,
        isOpenModalGetSales,
        isOpenModalGetSale,
        isOpenResultadoModal,
    } = useSelector(state => state.layout);
    const dispatch = useDispatch();

    // Em /trips usamos loading local (Backdrop na página) para evitar modal grande.
    if (router.pathname === '/trips') {
        return null;
    }

    const hasAnyModalOpen =
        isOpenModal ||
        isOpenUserModal ||
        isOpenModelModal ||
        isOpenLetterModal ||
        isOpenModalGetSales ||
        isOpenModalGetSale ||
        isOpenResultadoModal;

    return (
        <Backdrop
            open={isOpenLoading}
            sx={{
                zIndex: (theme) => theme.zIndex.modal + 200,
                color: '#fff',
                background: 'var(--lg-overlay-bg)',
                backdropFilter: 'var(--lg-blur-overlay)',
                WebkitBackdropFilter: 'var(--lg-blur-overlay)',
                flexDirection: 'column',
                gap: 1.2,
            }}
        >
            <CircularProgress color="inherit" size={34} />
            <Typography variant="body2" sx={{ color: 'var(--lg-text-primary)' }}>
                {hasAnyModalOpen ? 'Salvando registro...' : 'Carregando...'}
            </Typography>
        </Backdrop>
    );
}
