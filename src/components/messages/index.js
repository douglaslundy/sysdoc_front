import React from "react";
import { useSelector } from "react-redux";

import Message from '../message/success';

/** Avisos de sucesso: pilha fixa no topo direito, acima de modais; o clique passa por cima do vazio. */
export default function Messages() {
    const { messages } = useSelector(state => state.layout);
    if (!messages.length) return null;
    return (
        <div className="ui-reset pointer-events-none fixed right-3 top-[72px] z-[9999] flex w-[min(380px,calc(100vw-24px))] flex-col gap-2 [&>*]:pointer-events-auto">
            {messages.map((msg, index) => <Message key={index} message={msg} />)}
        </div>
    )
}
