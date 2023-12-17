import { api } from "../../../services/api";
import { inactiveRoom, addRoom, editRoom, addRooms } from "../../ducks/rooms";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";

export const getAllRooms = () => {

    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get('/rooms')
            .then((res) => {
                dispatch(addRooms(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}
export const getAllRoomsWithTodayCalls = () => {

    return (dispatch) => {
        dispatch(turnLoading());
        api
            .get('/rooms/todaycalls')
            .then((res) => {
                dispatch(addRooms(res.data));
                dispatch(turnLoading());
            })
            .catch(() => { dispatch(turnLoading()) })
    }
}

export const addRoomFetch = (room, cleanForm) => {

    return (dispatch) => {
        dispatch(turnLoading());        
        api.post('/rooms', room)
            .then((res) =>
            (
                res = {
                    ...res.data.room,
                    call_service : {
                        'id': res.data.room.id,
                        'name' : room.name
                    }
                    
                },
                dispatch(addRoom(res)),
                dispatch(addMessage(`O Sala ${res.name} foi adicionadacom sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm()
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
};

export const editRoomFetch = (room, cleanForm) => {
    return (dispatch) => {
        dispatch(turnLoading());

        api.put(`/rooms/${room.id}`, room)
            .then((res) =>
            (
                dispatch(editRoom(room)),
                dispatch(addMessage(`O Sala ${room.name} foi atualizada com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm()
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
}

export const inactiveRoomFetch = (room) => {
    return (dispatch) => {
        dispatch(turnLoading())

        api.delete(`/rooms/${room.id}`)
            .then((res) =>
            (
                dispatch(inactiveRoom(room)),
                dispatch(addMessage(`O Sala ${room.name} foi excluida com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(`ERROR - ${error.response.data.message} `));
                dispatch(turnLoading());
            })
    }
}