import React, { useEffect, useState } from 'react'
import { useSelector } from "react-redux";

import MessageAlert from '../message/alertModal'

// Várias telas ainda montam este componente ao mesmo tempo (página + modal). Só a primeira instância montada
// desenha a pilha de avisos, para o mesmo erro não aparecer duplicado.
const instancias = [];
const avisar = () => instancias.forEach((i) => i.atualizar((n) => n + 1));

function useEPrimeira() {
    const [id] = useState(() => ({}));
    const [, atualizar] = useState(0);
    useEffect(() => {
        instancias.push({ id, atualizar });
        avisar();
        return () => {
            instancias.splice(instancias.findIndex((i) => i.id === id), 1);
            avisar();
        };
    }, [id]);
    return instancias[0]?.id === id;
}

/** Avisos de erro (somem em 12s): pilha fixa no topo direito, acima dos modais. */
export default function AlertModal() {
    const { alertMessages } = useSelector(state => state.layout);
    const primeira = useEPrimeira();
    if (!primeira || !alertMessages.length) return null;
    return (
        <div className="pointer-events-none fixed right-3 top-[72px] z-[9999] flex w-[min(380px,calc(100vw-24px))] flex-col gap-2 [&>*]:pointer-events-auto">
            {alertMessages.map((msg, index) => <MessageAlert key={`${msg}-${index}`} message={msg} />)}
        </div>
    )
}
