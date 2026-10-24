import React from 'react'
import { useSelector } from "react-redux";

import MessageAlert from '../message/alertModal'

/** Avisos de erro (somem em 12s): mesma pilha fixa do topo, acima dos modais. */
export default function AlertModal() {
    const { alertMessages } = useSelector(state => state.layout);
    if (!alertMessages.length) return null;
    return (
        <div className="ui-reset pointer-events-none fixed right-3 top-[72px] z-[9999] flex w-[min(380px,calc(100vw-24px))] flex-col gap-2 [&>*]:pointer-events-auto">
            {alertMessages.map((msg, index) => <MessageAlert key={`${msg}-${index}`} message={msg} />)}
        </div>
    )
}
