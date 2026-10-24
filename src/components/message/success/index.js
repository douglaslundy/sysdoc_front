import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { removeMessage } from '../../../store/ducks/Layout';
import { Banner } from '../../ui/banner';

export default function Success({ message }) {
    const dispatch = useDispatch();

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch(removeMessage(message));
        }, 3000);
        return () => clearTimeout(timer);
    }, [dispatch, message]);

    return (
        <Banner tom="sucesso" onDispensar={() => dispatch(removeMessage(message))}>
            {message}
        </Banner>
    );
}
