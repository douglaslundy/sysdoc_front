import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllMedicos, removeMedicoFetch } from '../../../store/fetchActions/medicosSolicitantes';
import { showMedico } from '../../../store/ducks/medicosSolicitantes';
import { openMedicoSolicitanteModal } from '../../../store/ducks/Layout';
import MedicoSolicitanteModal from '../../modal/medicoSolicitante';
import AlertModal from '../../messagesModal';
import { ActionCreateFab } from '../../actions';
import { AcoesDeLinha } from '../../ui/acoes-de-linha';
import { PaginaDeLista } from '../../ui/pagina-de-lista';
import { Pilula } from '../../ui/pilula';
import { usePaginacaoLocal } from '../../../lib/usePaginacaoLocal';

export default function MedicosSolicitantes() {
    const dispatch = useDispatch();
    const { medicos } = useSelector(state => state.medicosSolicitantes);

    const [busca, setBusca] = useState('');

    useEffect(() => {
        dispatch(getAllMedicos({ all: true }));
    }, []);

    const filtrados = medicos.filter(m =>
        m.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        m.crm?.toLowerCase().includes(busca.toLowerCase()) ||
        m.especialidade?.toLowerCase().includes(busca.toLowerCase())
    );
    const { fatia, propsDaPaginacao } = usePaginacaoLocal(filtrados, 15);

    const handleNovo = () => {
        dispatch(showMedico({}));
        dispatch(openMedicoSolicitanteModal());
    };

    const handleEditar = (medico) => {
        dispatch(showMedico(medico));
        dispatch(openMedicoSolicitanteModal());
    };

    const colunas = [
        {
            chave: 'nome',
            titulo: 'Nome',
            render: (medico) => (
                <>
                    <span className="block font-semibold">{medico.nome}</span>
                    {medico.telefone && <span className="block text-xs text-muted-foreground">{medico.telefone}</span>}
                </>
            ),
        },
        {
            chave: 'crm',
            titulo: 'CRM / UF',
            render: (medico) => (medico.crm ? `${medico.crm}${medico.uf_crm ? '/' + medico.uf_crm : ''}` : '—'),
        },
        { chave: 'especialidade', titulo: 'Especialidade', render: (medico) => medico.especialidade || '—' },
        {
            chave: 'status',
            titulo: 'Status',
            render: (medico) => <Pilula tom={medico.ativo ? 'sucesso' : 'perigo'}>{medico.ativo ? 'Ativo' : 'Inativo'}</Pilula>,
        },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (medico) => (
                <AcoesDeLinha
                    rotuloEditar="Editar médico"
                    rotuloExcluir="Remover médico"
                    aoEditar={() => handleEditar(medico)}
                    aoExcluir={() => dispatch(removeMedicoFetch(medico.id))}
                />
            ),
        },
    ];

    return (
        <MedicoSolicitanteModal>
            <PaginaDeLista
                titulo={`Você possui ${medicos.length} Médicos Cadastrados`}
                busca={{ rotulo: 'Buscar médico', placeholder: 'Buscar médico...', value: busca, onChange: (e) => setBusca(e.target.value), maxLength: 80 }}
                barra={<ActionCreateFab title="Novo Médico" onClick={handleNovo} />}
                colunas={colunas}
                linhas={fatia}
                chaveDaLinha={(medico) => medico.id}
                vazio="Nenhum médico encontrado"
                rotuloDaTabela="médicos"
                paginacao={{ ...propsDaPaginacao, opcoes: [10, 15, 25] }}
            >
                <AlertModal />
            </PaginaDeLista>
        </MedicoSolicitanteModal>
    );
}
