import React from "react";

import Message from '../message/success';

import { useSelector} from "react-redux";

export default function Messages() {
    const { messages } = useSelector(state => state.layout);
    return (
        <div className='messages'>
            {messages.map((msg, index) => <Message key={index} message={msg} />)}
        </div>
    )
}
