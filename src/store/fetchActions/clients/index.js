import { cleanCpfCnpj } from "../../../components/helpers/formatt/cpf_cnpj";
import { cleanPhone } from "../../../components/helpers/formatt/phone";
import { api } from "../../../services/api";
import { inactiveClient, addClient, editClient, addClients } from "../../ducks/clients";
import { turnAlert, addMessage, addAlertMessage, turnLoading } from "../../ducks/Layout";
import { format, parse, parseISO } from 'date-fns';

// function getToken() {
//     const { 'sysvendas.token': token } = parseCookies();    
//     token ? api.defaults.headers['Authorization'] = `Bearer ${token}` : Router.push('/login');
// }

const converterData = (dataString) => {
    // Converter a string para um objeto de data usando a função parse
    const data = parse(dataString, 'yyyy/MM/dd', new Date());

    // Verificar se a conversão foi bem-sucedida
    if (isNaN(data.getTime())) {
        throw new Error('Data inválida');
    }

    // Formatar a data no novo formato desejado
    const dataFormatada = format(data, 'yyyy-MM-dd');

    return dataFormatada;
};

export const getAllClients = () => {

    return (dispatch) => {
        dispatch(turnLoading());

        api
            .get('/clients')
            .then((res) => {
                dispatch(addClients(res.data));
                dispatch(turnLoading());
            })
            .catch((error) => {
                dispatch(turnLoading())
            })
    }
}

export const addClientFetch = (client, cleanForm) => {
    return (dispatch) => {
        dispatch(turnLoading());

        client = {
            name: client.name,
            mother: client.mother,
            father: client.father,
            cpf: cleanCpfCnpj(client.cpf),
            cns: client.cns,
            phone: cleanPhone(client.phone),
            email: client.email,
            obs: client.obs,
            born_date: client?.born_date ? format(client?.born_date, 'yyyy/MM/dd') : null,
            sexo: client.sexo,
            // active: client.active,

            addresses: {
                zip_code: client.zip_code,
                city: client.city,
                street: client.street,
                number: client.number,
                district: client.district,
                complement: client.complement
            }
        };

        api.post('/clients', client)
            .then((res) =>
            (
                client = {
                    ...res.data.client,
                    born_date: res?.data?.client?.born_date ? converterData(res.data.client.born_date) : null,
                },

                dispatch(addClient(client)),
                dispatch(addMessage(`O cliente ${client.name} foi adicionado com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm()
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error ? `ERROR - ${error?.response?.data?.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error.response ? error.response.data : 'erro desconhecido';
            })
    };
};

export const editClientFetch = (client, cleanForm) => {
    return (dispatch) => {
        dispatch(turnLoading());

        client = {
            ...client,
            cpf: cleanCpfCnpj(client.cpf),
            phone: cleanPhone(client.phone),
            born_date: client?.born_date ? format(client?.born_date, 'yyyy-MM-dd') : null,
            addresses: {
                zip_code: client.zip_code,
                city: client.city,
                street: client.street,
                number: client.number,
                district: client.district,
                complement: client.complement
            }
        };

        api.patch(`/clients/${client.id}`, client)
            .then((res) =>
            (

                dispatch(editClient(client)),
                dispatch(addMessage(`O cliente ${client.name} foi atualizado com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading()),
                cleanForm()
            ))
            .catch((error) => {
                dispatch(addAlertMessage(error.response ? `ERROR - ${error.response.data.message} ` : 'Erro desconhecido'));
                dispatch(turnLoading());
                return error ? error.response.data.message : 'erro desconhecido';
            })
    };
}

export const inactiveClientFetch = (client) => {
    return (dispatch) => {
        dispatch(turnLoading())

        api.delete(`/clients/${client.id}`)
            .then((res) =>
            (
                dispatch(inactiveClient(client)),
                dispatch(addMessage(`O cliente ${client.name} foi inativado com sucesso!`)),
                dispatch(turnAlert()),
                dispatch(turnLoading())
            ))
            .catch((error) => {
                dispatch(addAlertMessage(`ERROR - ${error.response.data.message} `));
                dispatch(turnLoading());
            })
    }
}