import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

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

    // Em /trips usamos loading local (Backdrop na página) para evitar modal grande.
    if (router.pathname === '/trips') {
        return null;
    }

    if (!isOpenLoading) return null;

    const hasAnyModalOpen =
        isOpenModal ||
        isOpenUserModal ||
        isOpenModelModal ||
        isOpenLetterModal ||
        isOpenModalGetSales ||
        isOpenModalGetSale ||
        isOpenResultadoModal;

    return (
        <div role="status" aria-live="polite" className="ui-reset fixed inset-0 z-[1700] flex flex-col items-center justify-center gap-3 bg-black/60 text-white">
            <Loader2 aria-hidden className="size-9 animate-spin" />
            <p className="text-sm font-medium">{hasAnyModalOpen ? 'Salvando registro...' : 'Carregando...'}</p>
        </div>
    );
}
