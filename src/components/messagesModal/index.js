import React from 'react'

import MessageAlert from '../message/alertModal'

import { useSelector } from "react-redux";

export default function AlertModal() {
    const { alertMessages } = useSelector(state => state.layout);
    return (
        <div className='messages'>
            {alertMessages.map((msg) => <MessageAlert key={Math.random()} message={msg} />)}
        </div>
    )
}