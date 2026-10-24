import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { removeAlertMessage } from '../../../store/ducks/Layout';
import { Banner } from '../../ui/banner';

export default function AlertModal({ message }) {
    const dispatch = useDispatch();

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(removeAlertMessage(message));
        }, 12000);
        return () => clearTimeout(timer);
    }, [dispatch, message]);

    return (
        <Banner tom="perigo" onDispensar={() => dispatch(removeAlertMessage(message))}>
            {message}
        </Banner>
    );
}
