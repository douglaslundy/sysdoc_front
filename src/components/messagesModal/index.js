import React from 'react'

import MessageAlert from '../message/alertModal'

import { useSelector } from "react-redux";

export default function AlertModal() {
    const { alertMessages } = useSelector(state => state.layout);
    return (
        <div className='messages'>
            {alertMessages.map((msg, index) => <MessageAlert key={`${msg}-${index}`} message={msg} />)}
        </div>
    )
}
