import { React, useEffect } from 'react';
import { Container, Alert } from "@mui/material";
import { useDispatch } from 'react-redux';
import { removeAlertMessage } from '../../../store/ducks/Layout';


export default function AlertModal( {message} ) {
    const dispatch = useDispatch();

    useEffect(() => {
        setTimeout(() => {
            dispatch(removeAlertMessage(message));
        }, 12000)
    }, [dispatch, message])

    return (
        <Container>
            <Alert variant="filled" severity="error">
                {message}
            </Alert>
            <br />
        </Container>
    );
}