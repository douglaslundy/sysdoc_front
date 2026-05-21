import { React, useEffect } from 'react';
import { Container, Alert } from "@mui/material";
import { useDispatch } from 'react-redux';
import { removeMessage } from '../../../store/ducks/Layout';


export default function Success( {message}) {
    const dispatch = useDispatch();

    useEffect(() => {
        setTimeout(() => {
            dispatch(removeMessage(message));
        }, 3000)
    }, [dispatch, message])

    return (
        <Container>
            <Alert variant="filled" severity="success">
                {message}
            </Alert>
        </Container>
    );
}