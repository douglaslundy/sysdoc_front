import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { List } from 'lucide-react';
import { getAllExames, removeExameFetch, editExameFetch } from '../../../store/fetchActions/exames';
import { showExame } from '../../../store/ducks/exames';
import { openExameModal } from '../../../store/ducks/Layout';
import ExameModal from '../../modal/exame';
import AlertModal from '../../messagesModal';
import { ActionCreateFab } from '../../actions';
import { AcoesDeLinha } from '../../ui/acoes-de-linha';
import { Button } from '../../ui/button';
import { PaginaDeLista } from '../../ui/pagina-de-lista';
import { Pilula } from '../../ui/pilula';
import { usePaginacaoLocal } from '../../../lib/usePaginacaoLocal';

export default function ExameCatalogo() {
    const dispatch = useDispatch();
    const { exames } = useSelector(state => state.exames);

    const [busca, setBusca] = useState('');

    useEffect(() => {
        dispatch(getAllExames());
    }, []);

    const filtrados = exames.filter(e =>
        e.nome?.toLowerCase().includes(busca.toLowerCase()) ||
        e.codigo?.toLowerCase().includes(busca.toLowerCase())
    );
    const { fatia, propsDaPaginacao } = usePaginacaoLocal(filtrados, 15);

    const handleNovoExame = () => {
        dispatch(showExame({}));
        dispatch(openExameModal());
    };

    const handleEditarExame = (exame) => {
        dispatch(showExame(exame));
        dispatch(openExameModal());
    };

    const handleToggleAtivo = (exame) => {
        dispatch(editExameFetch(exame.id, { ...exame, ativo: !exame.ativo }));
    };

    const colunas = [
        {
            chave: 'nome',
            titulo: 'Nome / Código',
            render: (exame) => (
                <>
                    <span className="block font-semibold">{exame.nome}</span>
                    <span className="block text-xs text-muted-foreground">{exame.codigo}</span>
                </>
            ),
        },
        { chave: 'categoria', titulo: 'Categoria', render: (exame) => exame.categoriaExame?.nome || '—' },
        {
            chave: 'status',
            titulo: 'Status',
            render: (exame) => (
                <button
                    type="button"
                    title={exame.ativo ? 'Desativar exame' : 'Ativar exame'}
                    onClick={() => handleToggleAtivo(exame)}
                    className="rounded-full focus-visible:ring-[3px] focus-visible:ring-primary/25 focus-visible:outline-none"
                >
                    <Pilula tom={exame.ativo ? 'sucesso' : 'perigo'}>{exame.ativo ? 'Ativo' : 'Inativo'}</Pilula>
                </button>
            ),
        },
        {
            chave: 'acoes',
            titulo: 'Ações',
            render: (exame) => (
                <AcoesDeLinha
                    rotuloEditar="Editar exame"
                    rotuloExcluir="Remover exame"
                    aoEditar={() => handleEditarExame(exame)}
                    aoExcluir={() => dispatch(removeExameFetch(exame.id))}
                >
                    <Button
                        variant="secondary"
                        size="icon-sm"
                        title="Gerenciar campos"
                        aria-label="Gerenciar campos"
                        onClick={() => { window.location.href = `/laboratorio/exames/${exame.id}/campos`; }}
                    >
                        <List />
                    </Button>
                </AcoesDeLinha>
            ),
        },
    ];

    return (
        <ExameModal>
            <PaginaDeLista
                titulo={`Você possui ${exames.length} Exames Cadastrados`}
                busca={{ rotulo: 'Buscar exame', placeholder: 'Buscar por nome ou código', value: busca, onChange: (e) => setBusca(e.target.value), maxLength: 60 }}
                barra={<ActionCreateFab title="Novo Exame" onClick={handleNovoExame} />}
                colunas={colunas}
                linhas={fatia}
                chaveDaLinha={(exame) => exame.id}
                vazio="Nenhum exame encontrado"
                rotuloDaTabela="exames"
                paginacao={{ ...propsDaPaginacao, opcoes: [10, 15, 25, 50] }}
            >
                <AlertModal />
            </PaginaDeLista>
        </ExameModal>
    );
}
